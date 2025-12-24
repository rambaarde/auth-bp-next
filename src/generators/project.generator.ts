import * as path from 'path';
import * as fs from 'fs-extra';
import { writeFile, ensureDir } from '../utils/file-generator';
import { generateConfigFile } from './config.generator';
import * as chalk from 'chalk';

export interface ProjectGeneratorOptions {
  projectRoot: string;
  config: {
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
    backendUrl: string;
  };
  templatesDir: string;
}

export async function generateProjectStructure(
  options: ProjectGeneratorOptions
): Promise<void> {
  const { projectRoot, config, templatesDir } = options;

  console.log(chalk.blue('\n📁 Generating project structure...\n'));

  // Create directory structure
  const srcDir = path.join(projectRoot, 'src');
  await ensureDir(srcDir);

  // Generate core modules
  await generateContextsModule(projectRoot, config);
  await generateHooksModule(projectRoot, config);
  await generateApiModule(projectRoot, config);
  await generateComponentsModule(projectRoot, config);
  await generateTypesModule(projectRoot, config);
  await generateMiddlewareModule(projectRoot, config);
  await generateConfigModule(projectRoot, config);

  // Generate configuration files
  await generateEnvTemplate(projectRoot, config);
  await generateConfigFile(projectRoot, config);

  // Generate root context
  await generateRootContext(projectRoot, config);

  console.log(chalk.green('✅ Project structure generated successfully!\n'));
  printGeneratedFiles(config);
}

async function generateContextsModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const contextsDir = path.join(projectRoot, 'src', 'contexts');
  await ensureDir(contextsDir);

  await writeFile(
    path.join(contextsDir, '.context.md'),
    generateContextFile(
      'Auth Contexts',
      'Global state management for authentication and user data',
      config
    )
  );

  await writeFile(
    path.join(contextsDir, 'auth-context.ts'),
    generateAuthContext(config)
  );

  await writeFile(
    path.join(contextsDir, 'auth-provider.tsx'),
    generateAuthProvider(config)
  );
}

async function generateHooksModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const hooksDir = path.join(projectRoot, 'src', 'hooks');
  await ensureDir(hooksDir);

  await writeFile(
    path.join(hooksDir, '.context.md'),
    generateContextFile(
      'Auth Hooks',
      'React hooks for authentication, RBAC, and tenant management',
      config
    )
  );

  await writeFile(
    path.join(hooksDir, 'use-auth.ts'),
    generateUseAuthHook(config)
  );

  await writeFile(
    path.join(hooksDir, 'use-protected-route.ts'),
    generateUseProtectedRoute(config)
  );

  if (config.rbac) {
    await writeFile(
      path.join(hooksDir, 'use-rbac.ts'),
      generateUseRBACHook(config)
    );
  }

  if (config.multitenant) {
    await writeFile(
      path.join(hooksDir, 'use-tenant.ts'),
      generateUseTenantHook(config)
    );
  }
}

async function generateApiModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const apiDir = path.join(projectRoot, 'src', 'api');
  await ensureDir(apiDir);

  await writeFile(
    path.join(apiDir, '.context.md'),
    generateContextFile(
      'API Integration',
      'API client with interceptors, endpoints, and request handling',
      config
    )
  );

  await writeFile(
    path.join(apiDir, 'api-client.ts'),
    generateAPIClient(config)
  );

  await writeFile(
    path.join(apiDir, 'auth.api.ts'),
    generateAuthAPI(config)
  );

  await writeFile(
    path.join(apiDir, 'endpoints.ts'),
    generateEndpoints(config)
  );
}

async function generateComponentsModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const componentsDir = path.join(projectRoot, 'src', 'components');
  await ensureDir(componentsDir);

  await writeFile(
    path.join(componentsDir, '.context.md'),
    generateContextFile(
      'Auth Components',
      'Reusable React components for authentication UI and access control',
      config
    )
  );

  await writeFile(
    path.join(componentsDir, 'auth-provider.tsx'),
    generateAuthProviderComponent(config)
  );

  await writeFile(
    path.join(componentsDir, 'protected-route.tsx'),
    generateProtectedRoute(config)
  );

  if (config.rbac) {
    await writeFile(
      path.join(componentsDir, 'can.tsx'),
      generateCanComponent(config)
    );

    await writeFile(
      path.join(componentsDir, 'cannot.tsx'),
      generateCannotComponent(config)
    );
  }

  if (config.multitenant) {
    await writeFile(
      path.join(componentsDir, 'tenant-selector.tsx'),
      generateTenantSelector(config)
    );
  }
}

async function generateTypesModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const typesDir = path.join(projectRoot, 'src', 'types');
  await ensureDir(typesDir);

  await writeFile(
    path.join(typesDir, '.context.md'),
    generateContextFile(
      'Type Definitions',
      'TypeScript interfaces and types for authentication',
      config
    )
  );

  await writeFile(
    path.join(typesDir, 'auth.types.ts'),
    generateAuthTypes(config)
  );
}

async function generateMiddlewareModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const middlewareDir = path.join(projectRoot, 'src', 'middleware');
  await ensureDir(middlewareDir);

  await writeFile(
    path.join(middlewareDir, '.context.md'),
    generateContextFile(
      'Middleware',
      'Next.js middleware for auth-related functionality',
      config
    )
  );

  await writeFile(
    path.join(middlewareDir, 'auth.middleware.ts'),
    generateAuthMiddleware(config)
  );
}

async function generateConfigModule(
  projectRoot: string,
  config: any
): Promise<void> {
  const configDir = path.join(projectRoot, 'src', 'config');
  await ensureDir(configDir);

  await writeFile(
    path.join(configDir, '.context.md'),
    generateContextFile(
      'Configuration',
      'Application configuration and API settings',
      config
    )
  );

  await writeFile(
    path.join(configDir, 'api.config.ts'),
    generateAPIConfig(config)
  );
}

async function generateEnvTemplate(
  projectRoot: string,
  config: any
): Promise<void> {
  const envContent = `# Backend API
NEXT_PUBLIC_API_URL=${config.backendUrl}

# Application
NEXT_PUBLIC_APP_NAME=My SaaS App
NODE_ENV=development
`;

  await writeFile(path.join(projectRoot, '.env.example'), envContent);
  await writeFile(path.join(projectRoot, '.env.local.example'), envContent);
}

async function generateRootContext(
  projectRoot: string,
  config: any
): Promise<void> {
  const contextContent = `# Authentication Boilerplate - Next.js Frontend

## Project Overview
This is an authentication boilerplate for Next.js with support for JWT-based authentication, optional RBAC, and optional multitenant architecture.

## Configuration Applied
- **Whitelabel**: ${config.whitelabel ? 'Enabled' : 'Disabled'}
- **RBAC**: ${config.rbac ? 'Enabled' : 'Disabled'}
- **Multitenant**: ${config.multitenant ? 'Enabled' : 'Disabled'}
- **Backend API**: ${config.backendUrl}

## Folder Structure

### Core Modules
- **src/contexts/**: Global authentication context and state
  - See [contexts/.context.md](./contexts/.context.md) for details
- **src/hooks/**: React hooks for auth, RBAC, and tenants
  - See [hooks/.context.md](./hooks/.context.md) for details
- **src/api/**: API client with interceptors and endpoints
  - See [api/.context.md](./api/.context.md) for details
- **src/components/**: Reusable auth components
  - See [components/.context.md](./components/.context.md) for details
- **src/types/**: TypeScript type definitions
  - See [types/.context.md](./types/.context.md) for details
- **src/middleware/**: Next.js middleware
  - See [middleware/.context.md](./middleware/.context.md) for details
- **src/config/**: Configuration files
  - See [config/.context.md](./config/.context.md) for details

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Setup environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Key Components

### AuthProvider
Wraps your app to provide global authentication context. Typically placed in \`src/app/layout.tsx\`:

\`\`\`tsx
import { AuthProvider } from '@/components/auth-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
\`\`\`

### useAuth Hook
Access authentication state and methods anywhere:

\`\`\`tsx
import { useAuth } from '@/hooks/use-auth';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? <p>Welcome, {user?.email}</p> : <p>Not logged in</p>}
    </div>
  );
}
\`\`\`

### Protected Routes
Protect pages from unauthenticated access:

\`\`\`tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>
  );
}
\`\`\`

${
  config.rbac
    ? `### RBAC Components
Use RBAC components for conditional rendering based on roles:

\`\`\`tsx
import { Can } from '@/components/can';

export function AdminPanel() {
  return (
    <Can role="admin">
      <div>Admin-only content</div>
    </Can>
  );
}
\`\`\``
    : ''
}

## Integration with Backend

This frontend works seamlessly with \`@auth-bp-nest\` backend package. Make sure both are configured with matching options:
- Whitelabel: ${config.whitelabel}
- RBAC: ${config.rbac}
- Multitenant: ${config.multitenant}

Backend API URL: \`${config.backendUrl}\`

## Environment Variables

See \`.env.example\` for all required environment variables.

## Common Tasks

Each folder has a \`.context.md\` file with detailed information about:
- Purpose and responsibilities
- How to extend and customize
- Related modules and dependencies
- Common tasks and examples

## Building for Production

\`\`\`bash
npm run build
npm run start
\`\`\`
`;

  await writeFile(path.join(projectRoot, 'src', '.context.md'), contextContent);
}

function generateContextFile(
  title: string,
  description: string,
  config: any
): string {
  return `# ${title}

## Purpose
${description}

## Configuration Applied
- Whitelabel: ${config.whitelabel}
- RBAC: ${config.rbac}
- Multitenant: ${config.multitenant}

## Files in This Module
<!-- List your files here -->

## Key Concepts
<!-- Explain key concepts -->

## Integration Points
<!-- Describe how this module integrates with others -->

## Common Tasks
<!-- List common modification tasks -->
`;
}

function generateAuthContext(config: any): string {
  return `'use client';

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '@/types/auth.types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

// Implementation details...
`;
}

function generateAuthProvider(config: any): string {
  return `'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { AuthContext } from './auth-context';
import { User } from '@/types/auth.types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated (from localStorage/cookie)
    const checkAuth = async () => {
      try {
        // Implementation to restore session
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
`;
}

function generateUseAuthHook(config: any): string {
  return `'use client';

import { useAuthContext } from '@/contexts/auth-context';

export function useAuth() {
  const context = useAuthContext();
  return context;
}
`;
}

function generateUseProtectedRoute(config: any): string {
  return `'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './use-auth';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isProtected: isAuthenticated };
}
`;
}

function generateUseRBACHook(config: any): string {
  return `'use client';

import { useAuth } from './use-auth';

export function useRBAC() {
  const { user } = useAuth();

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: string[]) => {
    return roles.every(role => hasRole(role));
  };

  return { hasRole, hasPermission, hasAnyRole, hasAllRoles };
}
`;
}

function generateUseTenantHook(config: any): string {
  return `'use client';

import { useAuth } from './use-auth';

export function useTenant() {
  const { user } = useAuth();

  return {
    tenantId: user?.tenantId,
    tenantSlug: user?.tenantSlug,
  };
}
`;
}

function generateAPIClient(config: any): string {
  return `import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Request interceptor for attaching JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh token logic here
    }

    return Promise.reject(error);
  }
);

export default api;
`;
}

function generateAuthAPI(config: any): string {
  return `import api from './api-client';

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  signup: (email: string, password: string, firstName: string, lastName: string) =>
    api.post('/auth/signup', { email, password, firstName, lastName }),

  logout: () => api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getCurrentUser: () => api.get('/auth/me'),
};
`;
}

function generateEndpoints(config: any): string {
  return `export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',

  ${config.rbac ? "// RBAC\n  ROLES: '/rbac/roles',\n  PERMISSIONS: '/rbac/permissions'," : ''}

  ${config.multitenant ? "// Tenant\n  TENANT: '/tenant',\n  TENANT_USERS: '/tenant/users'," : ''}
};
`;
}

function generateAuthProviderComponent(config: any): string {
  return `import { AuthProvider as ContextProvider } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ContextProvider>{children}</ContextProvider>;
}
`;
}

function generateProtectedRoute(config: any): string {
  return `'use client';

import { useProtectedRoute } from '@/hooks/use-protected-route';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isProtected } = useProtectedRoute();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isProtected) {
    return null;
  }

  return <>{children}</>;
}
`;
}

function generateCanComponent(config: any): string {
  return `'use client';

import { useRBAC } from '@/hooks/use-rbac';

interface CanProps {
  role?: string;
  roles?: string[];
  permission?: string;
  children: React.ReactNode;
}

export function Can({ role, roles, permission, children }: CanProps) {
  const { hasRole, hasPermission, hasAnyRole } = useRBAC();

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = hasAnyRole(roles);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
`;
}

function generateCannotComponent(config: any): string {
  return `'use client';

import { useRBAC } from '@/hooks/use-rbac';

interface CannotProps {
  role?: string;
  children: React.ReactNode;
}

export function Cannot({ role, children }: CannotProps) {
  const { hasRole } = useRBAC();

  if (hasRole(role || '')) {
    return null;
  }

  return <>{children}</>;
}
`;
}

function generateTenantSelector(config: any): string {
  return `'use client';

import { useTenant } from '@/hooks/use-tenant';

export function TenantSelector() {
  const { tenantSlug } = useTenant();

  return (
    <div>
      <p>Current Tenant: {tenantSlug}</p>
      {/* Add tenant switching UI here */}
    </div>
  );
}
`;
}

function generateAuthTypes(config: any): string {
  return `export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  ${config.multitenant ? 'tenantId?: string;\n  tenantSlug?: string;' : ''}
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  ${config.rbac ? 'roles?: string[];\n  permissions?: string[];' : ''}
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}
`;
}

function generateAuthMiddleware(config: any): string {
  return `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;

  // You can add route protection logic here
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
`;
}

function generateAPIConfig(config: any): string {
  return `export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'authToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  TOKEN_EXPIRATION_BUFFER: 60 * 5, // 5 minutes
};
`;
}

function printGeneratedFiles(config: any): void {
  console.log(chalk.blue('📁 Generated files:\n'));
  console.log(chalk.green('  ✓ src/contexts/'));
  console.log(chalk.green('  ✓ src/hooks/'));
  console.log(chalk.green('  ✓ src/api/'));
  console.log(chalk.green('  ✓ src/components/'));
  console.log(chalk.green('  ✓ src/types/'));
  console.log(chalk.green('  ✓ src/middleware/'));
  console.log(chalk.green('  ✓ src/config/'));
  console.log(chalk.green('  ✓ .env.example'));
  console.log(chalk.green('  ✓ .auth-bp-config.json'));
  console.log(chalk.blue('\n📚 Next steps:'));
  console.log('  1. Review .env.example and create .env.local');
  console.log('  2. Wrap your app with <AuthProvider> in layout.tsx');
  console.log('  3. Update NEXT_PUBLIC_API_URL to match your backend');
  console.log('  4. Check .context.md files in each folder');
  console.log('  5. npm run dev\n');
}
