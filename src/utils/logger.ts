import winston from 'winston';
import { env } from '../config/environment';
import path from 'path';

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.dirname(env.LOG_FILE_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'discord-mcp' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: env.LOG_FILE_PATH,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write error logs to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If not in production, also log to console
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

export default logger;
