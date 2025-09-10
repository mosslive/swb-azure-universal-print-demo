# Azure Universal Print Demo

A complete web application demonstrating Microsoft Entra ID authentication with On-Behalf-Of (OBO) token flow for accessing Microsoft Graph Universal Print APIs.

## 🏗️ Architecture

- **Frontend**: React SPA with TypeScript, MSAL authentication, and Vite
- **Backend**: Node.js/Express API with MSAL OBO flow and Microsoft Graph integration
- **Authentication**: Microsoft Entra ID with custom API scopes
- **Deployment**: Docker containers with Azure App Services support

## 🔧 Features

- ✅ **Microsoft Entra ID Authentication** - Secure user sign-in with MSAL
- ✅ **On-Behalf-Of Token Flow** - Backend acquires Graph tokens using user context
- ✅ **Universal Print Integration** - List printers, create print jobs, upload documents
- ✅ **Real-time Job Status** - Monitor print job progress with auto-refresh
- ✅ **Secure Configuration** - Environment-based configuration management
- ✅ **Production Ready** - Docker containers, health checks, logging
- ✅ **Developer Experience** - TypeScript, ESLint, Prettier, automated testing

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Azure AD tenant with Universal Print licenses
- Registered Azure AD application

### 1. Clone and Setup

```bash
git clone <repository-url>
cd swb-azure-universal-print-demo

# Start development environment (installs dependencies and starts both apps)
./scripts/dev-start.sh
```

### 2. Configure Azure AD Application

1. **Register Application**:
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Create new registration with redirect URI: `http://localhost:3000`

2. **Configure API Permissions**:
   - Add Microsoft Graph permissions: `Print.ReadWrite.All` (delegated)
   - Grant admin consent for the permissions

3. **Create API Scope**:
   - Go to Expose an API > Add a scope
   - Create scope: `access_as_user` with admin and user consent

4. **Generate Client Secret**:
   - Go to Certificates & secrets > New client secret
   - Copy the secret value (you'll need this for backend configuration)

### 3. Environment Configuration

Copy example files and update with your Azure configuration:

**Backend (`backend/.env`)**:
```env
PORT=3001
NODE_ENV=development
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_CLIENT_SECRET=your-azure-app-client-secret  
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_AUDIENCE=api://your-custom-api-scope
CORS_ORIGINS=http://localhost:3000
```

**Frontend (`frontend/.env`)**:
```env
VITE_AZURE_CLIENT_ID=your-azure-app-client-id
VITE_AZURE_TENANT_ID=your-azure-tenant-id
VITE_AZURE_SCOPE=api://your-custom-api/access_as_user
VITE_BACKEND_URL=http://localhost:3001
VITE_REDIRECT_URI=http://localhost:3000
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 📁 Project Structure

```
/
├── README.md
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── server.ts       # Express server
│   │   ├── config.ts       # Environment configuration
│   │   ├── middleware/
│   │   │   └── auth.ts     # JWT validation middleware
│   │   ├── services/
│   │   │   ├── msalClient.ts       # MSAL OBO client
│   │   │   └── graphPrintService.ts # Graph API wrapper
│   │   ├── routes/
│   │   │   ├── printers.ts # Printer endpoints
│   │   │   └── printJobs.ts # Print job endpoints
│   │   └── utils/
│   │       └── logger.ts   # Structured logging
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── auth/          # MSAL authentication
│   │   ├── components/    # React components
│   │   ├── api/           # API client
│   │   └── types/         # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── docker/                # Container configuration
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   ├── nginx.conf
│   └── docker-compose.yml
├── infra/                 # Infrastructure as Code
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── scripts/               # Development scripts
    ├── dev-start.sh       # Start development environment
    └── build-all.sh       # Build and test all components
```

## 🔐 Authentication Flow

1. **Frontend Authentication**:
   - User signs in via MSAL popup/redirect
   - Frontend obtains access token for custom API scope
   - Token included in API requests to backend

2. **Backend Token Validation**:
   - JWT validation using Azure AD public keys
   - Scope validation for `access_as_user`
   - User context extracted from token

3. **On-Behalf-Of Flow**:
   - Backend exchanges user token for Graph token
   - Graph token used to call Universal Print APIs
   - User permissions preserved throughout flow

## 🖨️ Universal Print APIs

### Supported Operations

- **List Printers**: `GET /api/printers`
- **Create Print Job**: `POST /api/print-jobs`
- **Upload Document**: `POST /api/print-jobs/upload`
- **Get Job Status**: `GET /api/print-jobs/{printerId}/{jobId}`
- **List Jobs**: `GET /api/printers/{printerId}/jobs`

### Example Usage

```typescript
// List available printers
const printers = await apiClient.listPrinters();

// Create and upload print job
const job = await apiClient.createAndUploadPrintJob({
  displayName: 'My Document',
  printerId: 'printer-id',
  configuration: {
    copies: 2,
    colorMode: 'color',
    duplex: 'simplex'
  }
}, file);

// Monitor job status
const status = await apiClient.getJobStatus(printerId, jobId);
```

## 🧪 Development

### Available Scripts

**Backend**:
```bash
cd backend
npm run dev      # Start development server
npm run build    # Build TypeScript
npm run test     # Run tests
npm run lint     # Run ESLint
```

**Frontend**:
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run type-check # TypeScript type checking
```

**Full Project**:
```bash
./scripts/dev-start.sh   # Start both frontend and backend
./scripts/build-all.sh   # Build and test entire project
```

### Testing

- **Unit Tests**: Jest for backend services and utilities
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint and Prettier configured
- **API Testing**: Use REST client with example requests

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start with Docker Compose
cd docker
docker-compose up --build

# Or build individual containers
docker build -f docker/backend.Dockerfile -t print-demo-backend ./backend
docker build -f docker/frontend.Dockerfile -t print-demo-frontend ./frontend
```

### Azure Deployment

```bash
# Deploy infrastructure with Terraform
cd infra/terraform
terraform init
terraform plan -var="azure_client_id=..." -var="azure_client_secret=..." -var="azure_tenant_id=..." -var="azure_audience=..."
terraform apply

# Deploy applications to App Services
# (Use Azure CLI or GitHub Actions)
```

## 🔒 Security Considerations

- **Token Security**: Access tokens never exposed to frontend
- **CORS Configuration**: Strict origin validation
- **HTTPS Only**: Production deployments use HTTPS
- **Secrets Management**: Azure Key Vault integration available
- **User Authorization**: Group-based access control ready

## 📚 API Reference

### Authentication

All API endpoints require Bearer token authentication:

```http
Authorization: Bearer <access-token>
```

### Endpoints

#### GET /api/printers
List available Universal Print printers.

**Response**:
```json
{
  "printers": [
    {
      "id": "printer-id",
      "name": "Office Printer",
      "manufacturer": "HP",
      "model": "LaserJet Pro",
      "isShared": true,
      "status": {
        "state": "ready"
      }
    }
  ]
}
```

#### POST /api/print-jobs/upload
Create print job and upload document.

**Request**:
```http
Content-Type: multipart/form-data

displayName: My Document
printerId: printer-id
document: [file]
configuration: {"copies": 1, "colorMode": "color"}
```

**Response**:
```json
{
  "printJob": {
    "id": "job-id",
    "status": {
      "state": "processing"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following existing code style
4. Add tests for new functionality
5. Run full build: `./scripts/build-all.sh`
6. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"Environment variable AZURE_CLIENT_ID is required"**
- Ensure `.env` files are created and populated with your Azure configuration

**"Failed to retrieve printers"**
- Verify Universal Print licenses are assigned to users
- Check Graph API permissions are granted and consented
- Ensure user has access to printers

**"Token validation failed"**
- Verify Azure AD application configuration
- Check audience/scope configuration matches between frontend and backend

**"CORS error"**
- Update CORS_ORIGINS in backend configuration
- Verify frontend URL matches allowed origins

For additional help, please create an issue with detailed error messages and configuration (without secrets).
