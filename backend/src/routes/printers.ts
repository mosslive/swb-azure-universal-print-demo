import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import GraphPrintService from '../services/graphPrintService';
import logger from '../utils/logger';

const router = Router();
const graphPrintService = new GraphPrintService();

/**
 * GET /api/printers
 * List all available printers
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const printers = await graphPrintService.listPrinters(req.token);
    
    logger.info(`Retrieved ${printers.length} printers for user ${req.user?.sub}`);
    res.json({ printers });
  } catch (error) {
    logger.error('Error listing printers', { 
      error: error instanceof Error ? error.message : error,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve printers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/printers/:printerId/jobs
 * List print jobs for a specific printer
 */
router.get('/:printerId/jobs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { printerId } = req.params;
    
    if (!printerId) {
      return res.status(400).json({ error: 'Printer ID is required' });
    }

    const jobs = await graphPrintService.listPrintJobs(req.token, printerId);
    
    logger.info(`Retrieved ${jobs.length} jobs for printer ${printerId}, user ${req.user?.sub}`);
    res.json({ jobs });
  } catch (error) {
    logger.error('Error listing print jobs', { 
      error: error instanceof Error ? error.message : error,
      printerId: req.params.printerId,
      user: req.user?.sub 
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve print jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;