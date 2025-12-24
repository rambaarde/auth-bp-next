import * as path from 'path';
import * as fs from 'fs-extra';
import {
  generateNextAuthConfig,
  generateLibAuthConfig,
  generateMiddleware,
  generateAuthComponents,
  generateApiClient,
  generateEnvFile,
} from './generator-orchestrator';
import { generateContextFiles } from './context-generator';

export interface Config {
  database: 'supabase' | 'google-cloud-sql';
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  backendUrl: string;
}

export async function generateModules(projectRoot: string, config: Config): Promise<void> {
  // Step 1: Generate NextAuth configuration and route handlers
  await generateNextAuthConfig(projectRoot, config);

  // Step 2: Generate lib/auth.config.ts
  await generateLibAuthConfig(projectRoot, config);

  // Step 3: Generate middleware.ts
  await generateMiddleware(projectRoot, config);

  // Step 4: Generate auth components
  await generateAuthComponents(projectRoot, config);

  // Step 5: Generate API client
  await generateApiClient(projectRoot, config);

  // Step 6: Generate environment file
  await generateEnvFile(projectRoot, config);

  // Step 7: Generate project structure
  await createProjectStructure(projectRoot, config);

  // Step 8: Generate auth-related files
  await generateAuthFiles(projectRoot, config);

  // Step 9: Generate hooks
  await generateHooks(projectRoot, config);

  // Step 10: Generate context documentation files
  await generateContextFiles(projectRoot, config);
}

async function createProjectStructure(projectRoot: string, config: Config): Promise<void> {
  const srcDir = path.join(projectRoot, 'src');

  // Create core directories
  const dirs = [
    'api',
    'hooks',
    'components/auth',
    'types',
  ];

  if (config.rbac) {
    dirs.push(
      'components/rbac',
      'hooks/use-rbac'
    );
  }

  if (config.multitenant) {
    dirs.push(
      'hooks/use-tenant',
      'components/tenant'
    );
  }

  for (const dir of dirs) {
    const fullPath = path.join(srcDir, dir);
    await fs.ensureDir(fullPath);
  }
}

async function generateAuthFiles(projectRoot: string, config: Config): Promise<void> {
  const srcDir = path.join(projectRoot, 'src');

  // Create auth types
  const authTypePath = path.join(srcDir, 'types', 'auth.ts');
  if (!await fs.pathExists(authTypePath)) {
    await fs.writeFile(
      authTypePath,
      `export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ${config.rbac ? 'roles?: string[];' : ''}
  ${config.multitenant ? 'tenantId?: string;' : ''}
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: Date;
}
`
    );
  }

  // Create auth service
  const authServicePath = path.join(srcDir, 'api', 'auth.ts');
  if (!await fs.pathExists(authServicePath)) {
    await fs.writeFile(
      authServicePath,
      `import { client } from './client';
import { AuthResponse, User } from '@/types/auth';

export const authAPI = {
  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await client.post<AuthResponse>('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await client.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getProfile() {
    const response = await client.get<User>('/auth/profile');
    return response.data;
  },

  async logout() {
    // Clear session - handled by NextAuth
    return null;
  },
};
`
    );
  }
}

async function generateHooks(projectRoot: string, config: Config): Promise<void> {
  const srcDir = path.join(projectRoot, 'src');

  // Create useAuth hook
  const useAuthPath = path.join(srcDir, 'hooks', 'use-auth.ts');
  if (!await fs.pathExists(useAuthPath)) {
    await fs.writeFile(
      useAuthPath,
      `'use client';

import { useSession } from 'next-auth/react';
import { User } from '@/types/auth';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user as User | undefined,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    status,
  };
}
`
    );
  }

  if (config.rbac) {
    const useRbacPath = path.join(srcDir, 'hooks', 'use-rbac', 'index.ts');
    if (!await fs.pathExists(useRbacPath)) {
      await fs.writeFile(
        useRbacPath,
        `'use client';

import { useAuth } from '@/hooks/use-auth';

export function useRBAC() {
  const { user } = useAuth();

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => user?.roles?.includes(role)) ?? false;
  };

  const hasAllRoles = (roles: string[]) => {
    return roles.every(role => user?.roles?.includes(role)) ?? false;
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    userRoles: user?.roles ?? [],
  };
}
`
      );
    }
  }

  if (config.multitenant) {
    const useTenantPath = path.join(srcDir, 'hooks', 'use-tenant', 'index.ts');
    if (!await fs.pathExists(useTenantPath)) {
      await fs.writeFile(
        useTenantPath,
        `'use client';

import { useAuth } from '@/hooks/use-auth';

export function useTenant() {
  const { user } = useAuth();

  return {
    tenantId: user?.tenantId,
    hasTenant: !!user?.tenantId,
  };
}
`
      );
    }
  }
}
