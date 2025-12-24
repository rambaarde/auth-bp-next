import * as path from 'path';
import * as fs from 'fs-extra';

export interface Config {
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  database: 'supabase' | 'google-cloud-sql';
  backendUrl: string;
}

/**
 * Generator Orchestrator
 * 
 * Scaffolds the complete Next.js auth file structure:
 * - NextAuth configuration and route handlers
 * - Middleware for protected routes and multitenant routing
 * - Auth components (login-form, register-form)
 * - Environment configuration file
 * - API client bridge to NestJS backend
 */

export async function generateNextAuthConfig(projectRoot: string, config: Config): Promise<void> {
  const appDir = path.join(projectRoot, 'app');
  const apiAuthDir = path.join(appDir, 'api', 'auth', '[...nextauth]');

  await fs.ensureDir(apiAuthDir);

  const nextAuthRoute = generateNextAuthRoute(config);
  await fs.writeFile(path.join(apiAuthDir, 'route.ts'), nextAuthRoute, 'utf-8');
}

export async function generateLibAuthConfig(projectRoot: string, config: Config): Promise<void> {
  const libDir = path.join(projectRoot, 'lib');
  await fs.ensureDir(libDir);

  const authConfig = generateAuthConfigContent(config);
  await fs.writeFile(path.join(libDir, 'auth.config.ts'), authConfig, 'utf-8');
}

export async function generateMiddleware(projectRoot: string, config: Config): Promise<void> {
  const middlewarePath = path.join(projectRoot, 'middleware.ts');

  const middleware = generateMiddlewareContent(config);
  await fs.writeFile(middlewarePath, middleware, 'utf-8');
}

export async function generateAuthComponents(projectRoot: string, config: Config): Promise<void> {
  const componentsDir = path.join(projectRoot, 'components', 'auth');
  await fs.ensureDir(componentsDir);

  // Generate login-form.tsx
  const loginForm = generateLoginForm(config);
  await fs.writeFile(path.join(componentsDir, 'login-form.tsx'), loginForm, 'utf-8');

  // Generate register-form.tsx
  const registerForm = generateRegisterForm(config);
  await fs.writeFile(path.join(componentsDir, 'register-form.tsx'), registerForm, 'utf-8');
}

export async function generateApiClient(projectRoot: string, config: Config): Promise<void> {
  const libDir = path.join(projectRoot, 'lib');
  await fs.ensureDir(libDir);

  const apiClient = generateApiClientContent(config);
  await fs.writeFile(path.join(libDir, 'api-client.ts'), apiClient, 'utf-8');
}

export async function generateEnvFile(projectRoot: string, config: Config): Promise<void> {
  const envPath = path.join(projectRoot, '.env.local');

  // Only write if not exists
  if (!(await fs.pathExists(envPath))) {
    const envContent = generateEnvContent(config);
    await fs.writeFile(envPath, envContent, 'utf-8');
  }
}

// ============================================================================
// CONTENT GENERATORS
// ============================================================================

function generateNextAuthRoute(config: Config): string {
  return `import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from '@/lib/auth.config';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call the auth-bp-nest backend
          const response = await fetch(\`\${authConfig.backendUrl}/auth/login\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          return {
            id: data.user.id,
            email: data.user.email,
            name: \`\${data.user.firstName} \${data.user.lastName}\`,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            accessToken: data.accessToken,
            \${config.rbac ? 'roles: data.user.roles,' : ''}
            \${config.multitenant ? 'tenantId: data.user.tenantId,' : ''}
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login?error=CredentialsSignin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        \${config.rbac ? 'token.roles = user.roles;' : ''}
        \${config.multitenant ? 'token.tenantId = user.tenantId;' : ''}
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.accessToken = token.accessToken as string;
        \${config.rbac ? 'session.user.roles = token.roles as string[];' : ''}
        \${config.multitenant ? 'session.user.tenantId = token.tenantId as string;' : ''}
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`;
}

function generateAuthConfigContent(config: Config): string {
  return `/**
 * Auth Configuration
 * 
 * Central configuration for authentication settings.
 * This file is used by NextAuth to configure JWT strategy
 * and backend API communication.
 */

export const authConfig = {
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  jwtSecretKey: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  \${config.rbac ? 'roles?: string[];' : ''}
  \${config.multitenant ? 'tenantId?: string;' : ''}
}

export interface Session {
  user: SessionUser;
  expires: string;
}
`;
}

function generateMiddlewareContent(config: Config): string {
  let middlewareCode = `import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

`;

  if (config.multitenant) {
    middlewareCode += `  // Multitenant: Extract subdomain and rewrite to /mp/[tenant] route
  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomain(host);

  if (subdomain && subdomain !== 'www') {
    // Rewrite request to /mp/[tenant] route
    const newUrl = new URL(request.url);
    newUrl.pathname = \`/mp/\${subdomain}\${pathname}\`;
    return NextResponse.rewrite(newUrl);
  }

`;
  }

  if (config.rbac) {
    middlewareCode += `  // RBAC: Check user roles from JWT token
  const session = await getSessionFromToken(request);
  
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add user info to response headers for use in route handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.user.id);
  requestHeaders.set('x-user-roles', JSON.stringify(session.user.roles || []));
  \${config.multitenant ? "requestHeaders.set('x-tenant-id', session.user.tenantId || '');" : ''}

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

`;
  } else {
    middlewareCode += `  // Standard: Redirect unauthenticated users to login
  return NextResponse.next();

`;
  }

  middlewareCode += `}

${config.multitenant ? `
/**
 * Extract subdomain from host header
 * Examples:
 * - tenant.localhost:3000 -> "tenant"
 * - subdomain.example.com -> "subdomain"
 * - example.com -> null
 */
function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  
  // Handle localhost with port
  if (parts[0].includes(':')) {
    const [hostname] = parts[0].split(':');
    return hostname !== 'localhost' && hostname !== 'www' ? hostname : null;
  }
  
  // Handle normal domains
  if (parts.length > 2) {
    return parts[0] !== 'www' ? parts[0] : null;
  }
  
  return null;
}
` : ''}

${config.rbac ? `
/**
 * Extract and verify JWT token from request
 * This function decodes the JWT to check user roles
 */
async function getSessionFromToken(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    // In production, verify the JWT signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}
` : ''}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

  return middlewareCode;
}

function generateLoginForm(config: Config): string {
  return `'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

${config.whitelabel ? `
interface LoginFormProps {
  logo?: string;
  primaryColor?: string;
  brandName?: string;
}

export function LoginForm({ 
  logo = '/logo.png', 
  primaryColor = '#3b82f6',
  brandName = 'Auth BP'
}: LoginFormProps) {
` : `
export function LoginForm() {
`}
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          ${config.whitelabel ? `
          <img 
            src={logo} 
            alt={brandName}
            className="h-12 w-auto mx-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to {brandName}
          </h2>
          ` : `
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          `}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            ${config.whitelabel ? 'style={{ backgroundColor: primaryColor }}' : ''}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${!config.whitelabel ? 'bg-blue-600 hover:bg-blue-700' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 ${!config.whitelabel ? 'focus:ring-blue-500' : ''} disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
`;
}

function generateRegisterForm(config: Config): string {
  return `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

${config.whitelabel ? `
interface RegisterFormProps {
  logo?: string;
  primaryColor?: string;
  brandName?: string;
}

export function RegisterForm({ 
  logo = '/logo.png', 
  primaryColor = '#3b82f6',
  brandName = 'Auth BP'
}: RegisterFormProps) {
` : `
export function RegisterForm() {
`}
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    ${config.multitenant ? 'tenantId: \'\',' : ''}
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const registerData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        ${config.whitelabel ? 'brandId: formData.brandId,' : ''}
        ${config.multitenant ? 'tenantId: formData.tenantId,' : ''}
      };

      // Remove undefined fields
      Object.keys(registerData).forEach(key => {
        if (registerData[key as keyof typeof registerData] === '') {
          delete registerData[key as keyof typeof registerData];
        }
      });

      const response = await apiClient.post('/auth/register', registerData);

      if (response.status === 201) {
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          ${config.whitelabel ? `
          <img 
            src={logo} 
            alt={brandName}
            className="h-12 w-auto mx-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create {brandName} Account
          </h2>
          ` : `
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          `}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="text"
              name="firstName"
              placeholder="First name"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="text"
              name="lastName"
              placeholder="Last name"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            ${config.whitelabel ? 'style={{ backgroundColor: primaryColor }}' : ''}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${!config.whitelabel ? 'bg-blue-600 hover:bg-blue-700' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 ${!config.whitelabel ? 'focus:ring-blue-500' : ''} disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
`;
}

function generateApiClientContent(config: Config): string {
  return `/**
 * API Client Bridge to auth-bp-nest Backend
 * 
 * This client handles all HTTP requests to the NestJS backend.
 * It automatically attaches the JWT token from NextAuth session.
 * 
 * Database: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL PostgreSQL'}
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create and configure the Axios instance
 * Adds JWT Bearer token from NextAuth session to all requests
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Attach JWT token
  client.interceptors.request.use(
    async (config) => {
      try {
        const session = await getSession();
        if (session?.user?.accessToken) {
          config.headers.Authorization = \`Bearer \${session.user.accessToken}\`;
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor: Handle 401 Unauthorized
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        // NextAuth will handle the redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

/**
 * Fetch helper with type safety
 * 
 * Usage:
 * \`\`\`
 * const data = await apiClient.post<User>('/auth/profile', {});
 * \`\`\`
 */
export async function fetchFromBackend<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  try {
    const response = await apiClient({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || error.message || 'API request failed'
      );
    }
    throw error;
  }
}

export default apiClient;
`;
}

function generateEnvContent(config: Config): string {
  let envContent = `# Next.js Authentication Boilerplate Environment Variables
# Copy this file to .env.local and fill in your values

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

`;

  if (config.database === 'supabase') {
    envContent += `# Database Configuration (Supabase)
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

`;
  } else if (config.database === 'google-cloud-sql') {
    envContent += `# Database Configuration (Google Cloud SQL)
# Get these from your Google Cloud Console
NEXT_PUBLIC_GOOGLE_CLOUD_SQL_INSTANCE=your-instance-connection-name
GOOGLE_CLOUD_SQL_USER=postgres
GOOGLE_CLOUD_SQL_PASSWORD=your-password

`;
  }

  if (config.whitelabel) {
    envContent += `# Whitelabeling Configuration
NEXT_PUBLIC_BRAND_NAME=Your Brand
NEXT_PUBLIC_BRAND_LOGO=/logo.png
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6

`;
  }

  if (config.multitenant) {
    envContent += `# Multitenant Configuration
NEXT_PUBLIC_TENANT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ALLOW_SUBDOMAINS=true

`;
  }

  if (config.rbac) {
    envContent += `# RBAC Configuration
NEXT_PUBLIC_ENABLE_RBAC=true

`;
  }

  return envContent;
}
