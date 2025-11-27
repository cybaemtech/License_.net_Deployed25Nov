# Environment Configuration

This project uses environment variables to configure API endpoints and other settings.

## Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your configuration:
   ```bash
   VITE_API_BASE_URL=https://your-api-server.com/api
   ```

## Environment Files

- `.env` - Local development (not committed to git)
- `.env.example` - Template file (committed to git)
- `.env.development` - Development mode defaults
- `.env.production` - Production mode defaults

## Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://cybaemtech.net/lms/api` |
| `VITE_APP_NAME` | Application name | `License Management System` |
| `VITE_APP_VERSION` | App version | `1.0.0` |

## Usage Examples

### Local Development with Local API
```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
```

### Production with Remote API  
```bash
# .env
VITE_API_BASE_URL=https://cybaemtech.net/lms/api
```

### Different Development Modes
```bash
# Use local API
npm run dev:local

# Use production API in development
npm run dev

# Build for production
npm run build:prod
```

## Security Notes

- Never commit `.env` files with sensitive information
- Use `.env.example` to document required variables
- The `.env` file is already in `.gitignore`