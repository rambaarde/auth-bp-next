import inquirer from 'inquirer';

export interface AuthBPNextConfig {
  database: 'supabase' | 'google-cloud-sql';
  whitelabel: boolean;
  rbac: boolean;
  multitenant: boolean;
  backendUrl: string;
}

export async function promptConfig(): Promise<AuthBPNextConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'database',
      message: 'Which database are you using?',
      choices: [
        { name: 'Supabase PostgreSQL', value: 'supabase' },
        { name: 'Google Cloud SQL PostgreSQL', value: 'google-cloud-sql' },
      ],
      default: 'supabase',
      prefix: '❓',
    },
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
