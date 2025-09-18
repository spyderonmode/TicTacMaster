# Email Configuration

This directory contains the email service configuration for TicTac 3x5.

## Configuration Methods

The application supports two ways to configure SMTP settings:

### 1. Config File (Recommended)
Create `email.json` in this directory with your SMTP credentials:

```json
{
  "smtp": {
    "host": "smtp.your-domain.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "your-email@your-domain.com",
      "pass": "your_smtp_password"
    }
  },
  "fromEmail": "your-email@your-domain.com"
}
```

### 2. Environment Variables (Fallback)
If no config file exists, the system will use these environment secrets:
- `SMTP_HOST`
- `SMTP_PORT` 
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`

## Security

- The `email.json` file is automatically ignored by git (see `.gitignore`)
- Use `email.json.example` as a template
- Never commit actual credentials to version control

## Common SMTP Settings

### Gmail
```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your_app_password"
    }
  },
  "fromEmail": "your-email@gmail.com"
}
```

### Custom Domain (SSL)
```json
{
  "smtp": {
    "host": "smtp.your-domain.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "admin@your-domain.com",
      "pass": "your_password"
    }
  },
  "fromEmail": "admin@your-domain.com"
}
```