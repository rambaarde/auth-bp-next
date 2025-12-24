import * as path from 'path';
import * as fs from 'fs-extra';

export interface Config {
  database: 'supabase' | 'google-cloud-sql';
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  backendUrl: string;
}

/**
 * Generate .env.example file with all possible environment variables
 * This file serves as documentation for developers on what env vars are needed
 */
export async function generateEnvExample(projectRoot: string, config: Config): Promise<void> {
  const envExamplePath = path.join(projectRoot, '.env.example');
  const content = generateEnvExampleContent(config);
  await fs.writeFile(envExamplePath, content, 'utf-8');
}

function generateEnvExampleContent(config: Config): string {
  let content = `# Next.js Authentication Boilerplate Environment Variables
# Copy this file to .env.local and fill in your actual values

# ============================================================================
# NextAuth Configuration (REQUIRED)
# ============================================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# ============================================================================
# Backend API Configuration (REQUIRED)
# ============================================================================
NEXT_PUBLIC_API_URL=http://localhost:3001

`;

  if (config.database === 'supabase') {
    content += `# ============================================================================
# Database Configuration: Supabase (REQUIRED for this project)
# ============================================================================
# Get these values from: https://app.supabase.com → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)

`;
  } else if (config.database === 'google-cloud-sql') {
    content += `# ============================================================================
# Database Configuration: Google Cloud SQL (REQUIRED for this project)
# ============================================================================
# Get these values from: Google Cloud Console → Cloud SQL → Connection Details
NEXT_PUBLIC_GOOGLE_CLOUD_SQL_INSTANCE=project:region:instance
GOOGLE_CLOUD_SQL_USER=postgres
GOOGLE_CLOUD_SQL_PASSWORD=your-secure-password
GOOGLE_CLOUD_SQL_DATABASE=auth_db

`;
  }

  if (config.whitelabel) {
    content += `# ============================================================================
# Whitelabel Configuration (ENABLED)
# ============================================================================
# Customize branding per tenant
NEXT_PUBLIC_BRAND_NAME=Your Brand Name
NEXT_PUBLIC_BRAND_LOGO=/logo.png
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6

`;
  }

  if (config.multitenant) {
    content += `# ============================================================================
# Multitenant Configuration (ENABLED)
# ============================================================================
# Configure subdomain handling for multiple tenants
NEXT_PUBLIC_TENANT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ALLOW_SUBDOMAINS=true

`;
  }

  if (config.rbac) {
    content += `# ============================================================================
# RBAC (Role-Based Access Control) Configuration (ENABLED)
# ============================================================================
# Features that use roles: admin panels, permission guards, etc.
NEXT_PUBLIC_ENABLE_RBAC=true

`;
  }

  content += `# ============================================================================
# Optional: Analytics & Monitoring
# ============================================================================
# NEXT_PUBLIC_ANALYTICS_ID=
# SENTRY_DSN=

# ============================================================================
# Optional: Development & Debugging
# ============================================================================
# NODE_ENV=development
# DEBUG=auth-bp:*

`;

  return content;
}
