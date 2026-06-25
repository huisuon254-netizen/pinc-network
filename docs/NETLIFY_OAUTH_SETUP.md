# Netlify OAuth Integration

## Overview

This document describes the Netlify OAuth integration setup for PINC, enabling single sign-on (SSO) and API access through Netlify's authentication system.

## Configuration Details

### Personal Access Token
- **Token**: Set via `NETLIFY_OAUTH_TOKEN` environment variable
- **Created**: June 13, 2026
- **User**: platform.pinc@gmail.com
- **Project Count**: 1 project
- **Team Collaboration**: 1 team

### OAuth Application Configuration

#### Application Details
- **Name**: platform
- **Client ID**: Set via `NETLIFY_OAUTH_CLIENT_ID` environment variable
- **Secret**: Set via `NETLIFY_OAUTH_CLIENT_SECRET` environment variable
- **Redirect URI**: `urn:ietf:wg:oauth:2.0:oob` (Out-of-Band)

#### Setup Instructions
1. Generate a personal access token in Netlify dashboard
2. Copy the token immediately (will not be visible again for security)
3. Store the token securely in your environment variables or configuration file
4. Configure the Client ID and Secret in your application settings

## Usage

### Environment Variables
```bash
# Required for Netlify OAuth - NEVER commit real values to git
NETLIFY_OAUTH_CLIENT_ID=your_client_id_here
NETLIFY_OAUTH_CLIENT_SECRET=your_client_secret_here
NETLIFY_OAUTH_TOKEN=your_personal_access_token_here
```

### API Integration
```javascript
// Example API call with Netlify OAuth
fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${process.env.NETLIFY_OAUTH_TOKEN}`
  }
});
```

## Security Considerations

### Token Security
1. **Keep tokens secure**: Store in environment variables or secure vaults
2. **Regular rotation**: Rotate tokens periodically
3. **Limited scope**: Use tokens with minimum required permissions
4. **Audit access**: Monitor OAuth application usage regularly

### Best Practices
- Never commit tokens to version control
- Use different tokens for development, staging, and production
- Set appropriate token expiration times
- Implement token validation on the server side

## Files Modified

### Configuration Files
- `.env.local` or `.env.production` - Environment variables
- `netlify.toml` - Netlify configuration (if applicable)

### Documentation
- `NETLIFY_OAUTH_SETUP.md` - This documentation file

## Troubleshooting

### Common Issues
1. **Token not working**: Verify token is correct and has proper permissions
2. **Client ID mismatch**: Ensure Client ID matches Netlify application
3. **Redirect URI issues**: Confirm redirect URI matches OAuth configuration
4. **Rate limiting**: Implement proper error handling for rate limits

### Error Codes
- `401 Unauthorized`: Token expired or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Application not configured

## Related Documentation

- [Platform Authentication Setup](/auth-setup)
- [Security Best Practices](/security)
- [Environment Configuration](/config/env)

## Support

For OAuth integration issues, contact the Netlify team or refer to the official Netlify OAuth documentation.

---

**Last Updated**: June 13, 2026
**Version**: 1.0.0
**Status**: Active
