# 🔐 Security Policy

## Protecting Secrets and Credentials

This repository contains sensitive information. Please follow these guidelines:

### ❌ DO NOT
- ❌ Commit `.env` files containing passwords, API keys, or tokens
- ❌ Store credentials in source code
- ❌ Push SSH keys, PEM files, or certificates
- ❌ Commit files with sensitive configuration
- ❌ Share secrets in pull request descriptions or comments

### ✅ DO
- ✅ Use `.env.example` as a template and copy to `.env` locally
- ✅ Add secret files to `.gitignore` (already configured)
- ✅ Use environment variables for all sensitive data
- ✅ Use GitHub Secrets for CI/CD workflows
- ✅ Rotate credentials regularly
- ✅ Review `.gitignore` before committing

## Setting Up Environment Variables

### Local Development
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or your preferred editor

# Never commit .env file!
```

### GitHub Actions
If this repository uses GitHub Actions:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add your secrets (e.g., `API_KEY`, `DB_PASSWORD`)
4. Reference in workflows: `${{ secrets.API_KEY }}`

## If You Accidentally Committed a Secret

⚠️ **If you've committed a secret, it's compromised!**

1. **Immediately revoke** the compromised credential/key
2. **Rotate** to a new secret
3. Remove from history using:
   ```bash
   git filter-repo --invert-paths --path path/to/secret-file
   ```

## Branch Protection Rules

This repository should have:
- ✅ Require pull request reviews
- ✅ Require status checks before merging
- ✅ Enforce signed commits (recommended)
- ✅ Dismiss stale reviews when new commits pushed
- ✅ Require branches to be up to date

## Security Scanning

This repository uses:
- 🔍 GitHub Secret Scanning (detects exposed secrets)
- 🔒 Dependabot (checks for vulnerable dependencies)

Monitor alerts in the **Security** tab.

## Reporting Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, email details to the repository owner.

---

**Last Updated:** 2026-05-31
