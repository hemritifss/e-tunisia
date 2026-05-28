import { Logger } from '@nestjs/common';

interface EnvRequirement {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  warning?: string;
}

const REQUIREMENTS: EnvRequirement[] = [
  { key: 'JWT_SECRET', required: true, validator: (v) => v.length >= 32 },
  { key: 'DB_TYPE', required: false, validator: (v) => ['postgres', 'mysql', 'sqlite'].includes(v) },
  { key: 'DB_HOST', required: true },
  { key: 'DB_USERNAME', required: true },
  { key: 'DB_PASSWORD', required: true, validator: (v) => v.length >= 8 },
  { key: 'DB_NAME', required: true },
  { key: 'REDIS_HOST', required: true },
  { key: 'S3_ENDPOINT', required: true },
  { key: 'S3_ACCESS_KEY', required: true },
  { key: 'S3_SECRET_KEY', required: true },
  { key: 'S3_BUCKET', required: false },
  { key: 'GOOGLE_CLIENT_ID', required: true, validator: (v) => v.includes('.apps.googleusercontent.com') },
  { key: 'VAPID_PUBLIC_KEY', required: true },
  { key: 'VAPID_PRIVATE_KEY', required: true },
  { key: 'MEILISEARCH_HOST', required: false, warning: 'Search will fall back to database queries' },
  { key: 'MEILISEARCH_API_KEY', required: false, warning: 'Search will fall back to database queries' },
  { key: 'STRIPE_SECRET_KEY', required: false, warning: 'Payments will run in mock mode' },
  { key: 'RESEND_API_KEY', required: false, warning: 'Emails will log to console only (dev fallback)' },
];

export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
  const logger = new Logger('EnvValidation');
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const req of REQUIREMENTS) {
    const value = process.env[req.key];

    if (req.required && !value) {
      errors.push(`Missing required environment variable: ${req.key}`);
      continue;
    }

    if (value && req.validator && !req.validator(value)) {
      errors.push(`Invalid value for ${req.key}: validation failed`);
      continue;
    }

    if (!value && req.warning) {
      warnings.push(`${req.key}: ${req.warning}`);
    }
  }

  // Extra security checks
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && ['etunisia_secret', 'secret', 'changeme', 'default'].includes(jwtSecret.toLowerCase())) {
    errors.push('JWT_SECRET is using a weak/default value. Change it immediately for production.');
  }

  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) {
    warnings.push('NODE_ENV is not set. Defaulting to development behavior.');
  }

  if (errors.length > 0) {
    logger.error('╔══════════════════════════════════════════════════════════════╗');
    logger.error('║  ENVIRONMENT VALIDATION FAILED                               ║');
    logger.error('╚══════════════════════════════════════════════════════════════╝');
    for (const err of errors) {
      logger.error(`  ✗ ${err}`);
    }
  }

  if (warnings.length > 0) {
    logger.warn('Environment warnings:');
    for (const warn of warnings) {
      logger.warn(`  ⚠ ${warn}`);
    }
  }

  if (errors.length === 0) {
    logger.log('✅ Environment validation passed');
  }

  return { valid: errors.length === 0, errors, warnings };
}
