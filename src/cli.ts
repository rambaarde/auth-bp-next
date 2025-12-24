#!/usr/bin/env node

import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { promptConfig } from './prompts';
import { generateProjectStructure } from './generators/project.generator';

const getCurrentWorkingDirectory = () => process.cwd();

export async function runCLI(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 Auth Boilerplate - Next.js Frontend\n'));
  console.log(chalk.blue('Initializing authentication setup...\n'));

  try {
    // Prompt user for configuration
    const config = await promptConfig();

    const spinner = ora('Generating project structure...').start();

    // Get project root (where npx command was run)
    const projectRoot = getCurrentWorkingDirectory();
    const templatesDir = path.join(__dirname, '..', 'templates');

    // Generate the project
    await generateProjectStructure({
      projectRoot,
      config,
      templatesDir,
    });

    spinner.succeed('Project structure generated successfully!');

    console.log(chalk.green('\n✅ Setup Complete!\n'));
    console.log(chalk.blue('📚 Documentation:'));
    console.log('  - Check .context.md files in each folder for detailed guidance');
    console.log('  - Review .auth-bp-config.json for your configuration');
    console.log('  - Copy .env.example to .env.local and fill in your details\n');

    console.log(chalk.yellow('⚠️  Configuration Summary:'));
    console.log(`  Whitelabel: ${config.whitelabel ? 'Enabled' : 'Disabled'}`);
    console.log(`  RBAC: ${config.rbac ? 'Enabled' : 'Disabled'}`);
    console.log(`  Multitenant: ${config.multitenant ? 'Enabled' : 'Disabled'}`);
    console.log(`  Backend URL: ${config.backendUrl}\n`);

    console.log(chalk.cyan('🚀 Next Steps:'));
    console.log('  1. npm install');
    console.log('  2. Configure .env.local with your backend URL');
    console.log('  3. Wrap your app with <AuthProvider> in app/layout.tsx');
    console.log('  4. Check .context.md files in each folder');
    console.log('  5. npm run dev\n');
  } catch (error: any) {
    console.error(chalk.red('\n❌ Error during setup:'), error.message);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  runCLI();
}
