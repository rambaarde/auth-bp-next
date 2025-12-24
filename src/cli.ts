#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import { promptConfig } from './prompts';
import { generateModules } from './generators/modules.generator';
import { generateContextFiles } from './generators/context-generator';
import { generateEnvExample } from './generators/env.generator';

const getCurrentWorkingDirectory = () => process.cwd();

export async function runCLI(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 Auth Boilerplate - Next.js Frontend\n'));
  console.log(chalk.blue('Initializing authentication setup...\n'));

  try {
    // Prompt user for configuration
    const config = await promptConfig();

    // Ask for project name
    const inquirer = await import('inquirer');
    const { projectName } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'auth-frontend',
        validate: (input) => {
          if (/^[a-z0-9-]+$/.test(input)) return true;
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        },
      },
    ]);

    const currentDir = getCurrentWorkingDirectory();
    const projectRoot = path.join(currentDir, projectName);

    // Step 1: Create Next.js project via CLI
    let spinner = ora('Creating Next.js project via CLI...').start();

    await new Promise<void>((resolve, reject) => {
      const nextProcess = spawn('npx', [
        'create-next-app@latest',
        projectName,
        '--typescript',
        '--tailwind',
        '--app',
        '--no-eslint',
      ], { cwd: currentDir });

      let errorOutput = '';
      nextProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      nextProcess.on('close', (code) => {
        if (code === 0) {
          spinner.succeed(`Next.js project "${projectName}" created!`);
          resolve();
        } else {
          spinner.fail('Failed to create Next.js project');
          reject(new Error(errorOutput || 'Next.js CLI failed'));
        }
      });
    });

    // Step 2: Generate modules and auth files
    spinner = ora('Generating authentication modules...').start();
    await generateModules(projectRoot, config);
    spinner.succeed('Modules generated!');

    // Step 3: Generate context files
    spinner = ora('Generating .context.md files...').start();
    await generateContextFiles(projectRoot, config);
    spinner.succeed('.context.md files generated!');

    // Step 4: Generate .env.example
    spinner = ora('Generating .env.example...').start();
    await generateEnvExample(projectRoot, config);
    spinner.succeed('.env.example generated!');

     // Step 5: Save configuration
     const configFile = {
      database: config.database,
      whitelabel: config.whitelabel,
      rbac: config.rbac,
      multitenant: config.multitenant,
      backendUrl: config.backendUrl,
      createdAt: new Date().toISOString(),
    };
    await fs.writeJson(path.join(projectRoot, '.auth-bp-config.json'), configFile, { spaces: 2 });

    console.log(chalk.green('\n✅ Setup Complete!\n'));
    console.log(chalk.blue('📁 Project Location:'));
    console.log(`  ${projectRoot}\n`);

    console.log(chalk.yellow('⚠️  Configuration Summary:'));
    console.log(`  Database: ${config.database === 'supabase' ? 'Supabase PostgreSQL' : 'Google Cloud SQL'}`);
    console.log(`  Whitelabel: ${config.whitelabel ? 'Enabled' : 'Disabled'}`);
    console.log(`  RBAC: ${config.rbac ? 'Enabled' : 'Disabled'}`);
    console.log(`  Multitenant: ${config.multitenant ? 'Enabled' : 'Disabled'}`);
    console.log(`  Backend URL: ${config.backendUrl}\n`);

    console.log(chalk.cyan('📚 Documentation:'));
    console.log('  - Check .context.md files in each folder for detailed guidance');
    console.log('  - Review .auth-bp-config.json for your configuration');
    console.log('  - See .env.example for required environment variables\n');

    console.log(chalk.cyan('🚀 Next Steps:'));
    console.log(`  1. cd ${projectName}`);
    console.log('  2. cp .env.example .env.local');
    console.log('  3. Configure NEXT_PUBLIC_API_URL in .env.local');
    console.log('  4. npm install');
    console.log('  5. npm run dev\n');

    console.log(chalk.green('✨ Your Next.js auth frontend is ready!\n'));
  } catch (error: any) {
    console.error(chalk.red('\n❌ Error during setup:'), error.message);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  runCLI();
}
