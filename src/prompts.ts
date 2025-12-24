import * as inquirer from 'inquirer';

export interface AuthBPNextConfig {
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  backendUrl?: string;
}

export async function promptConfig(): Promise<AuthBPNextConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'whitelabel',
      message: 'Enable Whitelabeling?',
      default: false,
      prefix: '❓',
    },
    {
      type: 'confirm',
      name: 'rbac',
      message: 'Enable RBAC (Role-Based Access Control)?',
      default: false,
      prefix: '❓',
    },
    {
      type: 'confirm',
      name: 'multitenant',
      message: 'Enable Multitenant support?',
      default: false,
      prefix: '❓',
    },
    {
      type: 'input',
      name: 'backendUrl',
      message: 'Backend API URL:',
      default: 'http://localhost:3001',
      prefix: '❓',
    },
  ]);

  return answers as AuthBPNextConfig;
}
