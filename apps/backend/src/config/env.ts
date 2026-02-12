/**
 * Environment variable validation
 * 
 * Import this module at the top of server.ts to fail fast
 * if required env vars are missing.
 */

import logger from '@utils/logger';

interface EnvConfig {
  /** Required in all environments */
  required: string[];
  /** Required only in production */
  requiredInProduction: string[];
}

const config: EnvConfig = {
  required: [
    'DATABASE_URL',
  ],
  requiredInProduction: [
    'JWT_SECRET',
    'CORS_ORIGIN',
  ],
};

export function validateEnv(): void {
  const missing: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const key of config.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (isProduction) {
    for (const key of config.requiredInProduction) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (isProduction) {
      throw new Error(`FATAL: ${message}`);
    } else {
      logger.warn(`${message} (non-production, continuing with defaults)`);
    }
  }

  logger.info(`Environment validated (${isProduction ? 'production' : 'development'})`);
}
