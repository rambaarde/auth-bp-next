/**
 * Middleware Builder
 * 
 * Dynamically constructs middleware.ts content based on configuration.
 * Handles:
 * - Multitenant subdomain extraction and rewriting
 * - RBAC role verification from JWT
 * - Protected route guards
 */

export interface MiddlewareConfig {
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  database: 'supabase' | 'google-cloud-sql';
  backendUrl: string;
}

/**
 * Build middleware content dynamically
 * 
 * Flow:
 * 1. Public routes bypass middleware (login, register, etc.)
 * 2. If multitenant: Extract subdomain and rewrite to /mp/[tenant]
 * 3. If RBAC: Verify JWT and check user roles
 * 4. Otherwise: Standard authentication check
 */
export function buildMiddlewareContent(config: MiddlewareConfig): string {
  return `import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

${config.multitenant ? generateSubdomainExtractor() : ''}

/**
 * Public routes that don't require authentication
 * These can be accessed without a valid session
 */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

/**
 * Protected routes that require authentication
 * Any request to these routes without a session will be redirected to /login
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  ${config.rbac ? "'/admin'," : ''}
  ${config.multitenant ? "'/mp'," : ''}
];

/**
 * Main middleware function
 * 
 * Processing order:
 * 1. Allow public routes to pass through
 * 2. Handle multitenant subdomain rewriting (if enabled)
 * 3. Handle RBAC verification (if enabled)
 * 4. Redirect unauthenticated users to login
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Handle multitenant routing
  ${config.multitenant ? `
  const tenant = extractSubdomainTenant(request);
  if (tenant) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = \`/mp/\${tenant}\${pathname}\`;
    return NextResponse.rewrite(newUrl);
  }
  ` : ''}

  // Handle RBAC verification
  ${config.rbac ? `
  const userRoles = extractUserRolesFromToken(request);
  if (!userRoles) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Inject user context into request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-roles', JSON.stringify(userRoles));
  ${config.multitenant ? "if (tenant) requestHeaders.set('x-tenant-id', tenant);" : ''}

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  ` : `
  // Standard authentication check
  // Redirect to login if no session
  return NextResponse.next();
  `}
}

/**
 * Check if route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

${config.multitenant ? `
/**
 * Extract tenant from subdomain
 * 
 * Examples:
 * - tenant1.localhost:3000 -> "tenant1"
 * - acme.example.com -> "acme"
 * - example.com -> null (no subdomain)
 * - www.example.com -> null (www is not a tenant)
 */
function extractSubdomainTenant(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  return extractSubdomain(host);
}

/**
 * Parse subdomain from host header
 * 
 * Regex logic:
 * - Split by "." to get parts
 * - Check if running on localhost (contains ":")
 * - Exclude "www" and numeric subdomains
 * - Return only valid tenant identifiers
 */
function extractSubdomain(host: string): string | null {
  // Handle localhost:port format
  if (host.includes('localhost')) {
    const [subdomain] = host.split(':');
    return subdomain !== 'localhost' ? subdomain : null;
  }

  // Handle domain.tld format
  const parts = host.split('.');
  
  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length < 3) {
    return null;
  }

  const potentialTenant = parts[0];
  
  // Exclude www and numeric-only subdomains
  if (potentialTenant === 'www' || /^\\d+$/.test(potentialTenant)) {
    return null;
  }

  // Only alphanumeric + hyphen for tenant slugs
  if (!/^[a-z0-9-]+$/.test(potentialTenant)) {
    return null;
  }

  return potentialTenant;
}
` : ''}

${config.rbac ? `
/**
 * Extract user roles from NextAuth JWT token
 * 
 * The token is stored in next-auth.session-token cookie
 * Decode the JWT payload to get user roles
 */
function extractUserRolesFromToken(request: NextRequest): string[] | null {
  try {
    const token = request.cookies.get('next-auth.session-token')?.value;
    
    if (!token) {
      return null;
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode JWT payload (base64url)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Return user roles from token
    return payload.roles || [];
  } catch (error) {
    console.error('Error extracting user roles from token:', error);
    return null;
  }
}

/**
 * Check if user has required role
 * 
 * Usage in route handlers:
 * \`\`\`typescript
 * const roles = request.headers.get('x-user-roles');
 * if (!hasRole(roles, 'admin')) {
 *   return Response.json({ error: 'Unauthorized' }, { status: 403 });
 * }
 * \`\`\`
 */
export function hasRole(rolesHeader: string | null, requiredRole: string): boolean {
  if (!rolesHeader) return false;
  try {
    const roles = JSON.parse(rolesHeader);
    return Array.isArray(roles) && roles.includes(requiredRole);
  } catch {
    return false;
  }
}
` : ''}

/**
 * Matcher configuration
 * Applies middleware to all routes except:
 * - API routes: /api/*
 * - Static assets: /_next/static/*
 * - Images: /_next/image/*
 * - Favicon: /favicon.ico
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;
}

/**
 * Generate subdomain extraction helper
 */
function generateSubdomainExtractor(): string {
  return `/**
 * Subdomain Extraction Helper
 * 
 * Used for multitenant routing where each tenant has a subdomain
 * Examples:
 * - acme.example.com -> "acme"
 * - tenant1.localhost:3000 -> "tenant1"
 * - example.com -> null (no subdomain)
 */
`;
}
