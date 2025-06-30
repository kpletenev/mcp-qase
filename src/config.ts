import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Define the configuration schema
const ConfigSchema = z.object({
  apiToken: z.string().min(1, 'API token is required'),
  configPath: z.string().optional(),
  debug: z.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;

// Default config file path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.qase-mcp-server.json');

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<Config> {
  const args = process.argv.slice(2);
  const config: Partial<Config> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--token' || arg === '-t') {
      config.apiToken = args[++i];
    } else if (arg === '--config' || arg === '-c') {
      config.configPath = args[++i];
    } else if (arg === '--debug' || arg === '-d') {
      config.debug = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return config;
}

/**
 * Load configuration from file
 */
function loadConfigFile(configPath: string): Partial<Config> {
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error: any) {
    console.error(
      `Error loading config file: ${error.message || 'Unknown error'}`,
    );
  }

  return {};
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
QASE MCP Server - MCP server for Qase API

Usage:
  npx qase-mcp-server [options]

Options:
  --token, -t <token>    Qase API token (can also be set via QASE_API_TOKEN env var)
  --config, -c <path>    Path to config file (default: ~/.qase-mcp-server.json)
  --debug, -d            Enable debug mode
  --help, -h             Show this help message

Examples:
  npx qase-mcp-server --token YOUR_API_TOKEN
  npx qase-mcp-server --config ./config.json
  
Environment Variables:
  QASE_API_TOKEN         Qase API token
  `);
}

/**
 * Get configuration from all sources
 */
export function getConfig(): Config {
  // Parse command line arguments
  const argsConfig = parseArgs();

  // Load config from file if specified
  const configPath = argsConfig.configPath || DEFAULT_CONFIG_PATH;
  const fileConfig = loadConfigFile(configPath);

  // Get config from environment variables
  const envConfig: Partial<Config> = {
    apiToken: process.env.QASE_API_TOKEN,
  };

  // Merge configs with priority: args > env > file
  const mergedConfig = {
    ...fileConfig,
    ...envConfig,
    ...argsConfig,
  };

  try {
    // Validate the config
    return ConfigSchema.parse(mergedConfig);
  } catch (error: any) {
    console.error('Configuration error:');
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error.message || 'Unknown validation error');
    }

    console.error(
      '\nPlease provide a valid API token via --token option or QASE_API_TOKEN environment variable.',
    );
    console.error('Run with --help for more information.');
    process.exit(1);
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Partial<Config>, configPath?: string): void {
  const filePath = configPath || DEFAULT_CONFIG_PATH;

  try {
    // Read existing config if it exists
    let existingConfig = {};
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingConfig = JSON.parse(fileContent);
    }

    // Merge with new config
    const newConfig = { ...existingConfig, ...config };

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(newConfig, null, 2));

    if (config.debug) {
      console.log(`Configuration saved to ${filePath}`);
    }
  } catch (error: any) {
    console.error(`Error saving config: ${error.message || 'Unknown error'}`);
  }
}
