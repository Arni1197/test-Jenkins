import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development','test','production').default('development'),
  PORT: Joi.number().default(3000),

  // JWT (разделяем секреты и TTL)
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'), // '15m' | '1h' | '7d'
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  // Твоё окружение
  REDIS_URL: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
});