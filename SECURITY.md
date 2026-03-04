# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability, **do not create a public issue**.

Contact the maintainers directly by sending an email or private message with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact

We commit to responding within 48 hours and prioritizing critical vulnerability fixes.

## Best practices

- Never commit secrets (`.env`, API keys, tokens)
- Always use environment variables for sensitive data
- Make sure `.env` is in `.gitignore` before pushing
