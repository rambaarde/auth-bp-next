import * as fs from 'fs-extra';
import * as path from 'path';

export interface AuthBPConfigFile {
  version: string;
  timestamp: string;
  frontend: {
    framework: string;
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
    backendUrl: string;
  };
}

export async function generateConfigFile(
  projectRoot: string,
  config: {
    whitelabel: boolean;
    rbac: boolean;
    multitenant: boolean;
    backendUrl: string;
  }
): Promise<void> {
  const configFile: AuthBPConfigFile = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    frontend: {
      framework: 'nextjs',
      ...config,
    },
  };

  const configPath = path.join(projectRoot, '.auth-bp-config.json');
  await fs.writeJSON(configPath, configFile, { spaces: 2 });
}

export async function loadConfig(
  projectRoot: string
): Promise<AuthBPConfigFile | null> {
  const configPath = path.join(projectRoot, '.auth-bp-config.json');
  try {
    return await fs.readJSON(configPath);
  } catch {
    return null;
  }
}
