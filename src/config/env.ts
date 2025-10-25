import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string | number;
  nodeEnv: string;
  lateFeePerDay: number;
}

const validateEnv = (): Config => {
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Convert JWT_EXPIRES_IN to seconds or keep as string
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return {
    port: parseInt(process.env.PORT || '1421', 10),
    mongoUri: process.env.MONGODB_URI!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: jwtExpiresIn,
    nodeEnv: process.env.NODE_ENV || 'development',
    lateFeePerDay: parseInt(process.env.LATE_FEE_PER_DAY || '10', 10),
  };
};

export const config = validateEnv();

