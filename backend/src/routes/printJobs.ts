import { Router, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../middleware/auth';
import GraphPrintService, { PrintJobRequest } from '../services/graphPrintService';
import logger from '../utils/logger';

const router = Router();
const graphPrintService = new GraphPrintService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, text files, and common document types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX files are allowed.'));
    }
  },
});

/**
 * POST /api/print-jobs
 * Create a new print job
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { displayName, printerId, configuration } = req.body;

    if (!displayName || !printerId) {
      return res.status(400).json({ 
        error: 'Missing required fields: displayName and printerId are required' 
      });
    }

    const jobRequest: PrintJobRequest = {
      displayName,
      printerId,
      configuration,
    };

    const printJob = await graphPrintService.createPrintJob(req.token, jobRequest);
    
    logger.info(`Created print job ${printJob.id} for user ${req.user?.sub}`);
    res.status(201).json({ printJob });
  } catch (error) {
    logger.error('Error creating print job', { 
      error: error instanceof Error ? error.message : error,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to create print job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/print-jobs/upload
 * Create a print job and upload document in one request
 */
router.post('/upload', upload.single('document'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const { displayName, printerId, configuration } = req.body;

    if (!displayName || !printerId) {
      return res.status(400).json({ 
        error: 'Missing required fields: displayName and printerId are required' 
      });
    }

    // Parse configuration if provided as string (from form data)
    let parsedConfiguration;
    if (configuration) {
      try {
        parsedConfiguration = typeof configuration === 'string' 
          ? JSON.parse(configuration) 
          : configuration;
      } catch (error) {
        return res.status(400).json({ error: 'Invalid configuration JSON' });
      }
    }

    const jobRequest: PrintJobRequest = {
      displayName,
      printerId,
      configuration: parsedConfiguration,
    };

    // Step 1: Create the print job
    const printJob = await graphPrintService.createPrintJob(req.token, jobRequest);
    
    // Step 2: Upload the document if upload URL is provided
    if (printJob.uploadUrl) {
      await graphPrintService.uploadDocument(
        req.token,
        printJob.uploadUrl,
        req.file.buffer,
        req.file.mimetype
      );
      
      logger.info(`Uploaded document to print job ${printJob.id} for user ${req.user?.sub}`);
    }
    
    logger.info(`Created and uploaded print job ${printJob.id} for user ${req.user?.sub}`);
    res.status(201).json({ 
      printJob: {
        ...printJob,
        uploadUrl: undefined, // Don't expose upload URL in response
      }
    });
  } catch (error) {
    logger.error('Error creating and uploading print job', { 
      error: error instanceof Error ? error.message : error,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to create and upload print job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/print-jobs/:jobId/upload
 * Upload document to an existing print job
 */
router.put('/:jobId/upload', upload.single('document'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const { jobId } = req.params;
    const { uploadUrl } = req.body;

    if (!uploadUrl) {
      return res.status(400).json({ error: 'Upload URL is required' });
    }

    await graphPrintService.uploadDocument(
      req.token,
      uploadUrl,
      req.file.buffer,
      req.file.mimetype
    );
    
    logger.info(`Uploaded document to existing print job ${jobId} for user ${req.user?.sub}`);
    res.json({ message: 'Document uploaded successfully', jobId });
  } catch (error) {
    logger.error('Error uploading document to print job', { 
      error: error instanceof Error ? error.message : error,
      jobId: req.params.jobId,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to upload document',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/print-jobs/:printerId/:jobId
 * Get status of a specific print job
 */
router.get('/:printerId/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { printerId, jobId } = req.params;

    if (!printerId || !jobId) {
      return res.status(400).json({ error: 'Printer ID and Job ID are required' });
    }

    const jobStatus = await graphPrintService.getJobStatus(req.token, printerId, jobId);
    
    logger.debug(`Retrieved job status for ${jobId}, user ${req.user?.sub}`);
    res.json({ job: jobStatus });
  } catch (error) {
    logger.error('Error getting print job status', { 
      error: error instanceof Error ? error.message : error,
      printerId: req.params.printerId,
      jobId: req.params.jobId,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve print job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;