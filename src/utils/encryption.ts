import crypto from 'crypto';
import { env } from '../config/environment';

/**
 * Enhanced encryption utilities with additional security measures
 */

// Generate a cryptographically secure random key
export const generateSecureKey = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate a secure IV (Initialization Vector)
export const generateIV = (): Buffer => {
  return crypto.randomBytes(16);
};

// Enhanced encryption with authenticated encryption
export const encryptSecure = (text: string, key: string = env.ENCRYPTION_KEY): string => {
  try {
    const iv = generateIV();
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    // Set the IV
    cipher.setAAD(Buffer.from('discord-mcp', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Enhanced decryption with authentication verification
export const decryptSecure = (encryptedText: string, key: string = env.ENCRYPTION_KEY): string => {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0] || '', 'hex');
    const authTag = Buffer.from(parts[1] || '', 'hex');
    const encrypted = parts[2] || '';
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('discord-mcp', 'utf8'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Hash with salt for storing sensitive data
export const hashWithSalt = (data: string, salt?: string): { hash: string; salt: string } => {
  const generatedSalt = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(data, generatedSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
};

// Verify hashed data
export const verifyHash = (data: string, hash: string, salt: string): boolean => {
  try {
    const testHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
};

// Secure token generation with expiration
export const generateSecureToken = (expirationMinutes: number = 60): { token: string; expires: Date } => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + expirationMinutes * 60 * 1000);
  
  return { token, expires };
};

// Validate token expiration
export const isTokenExpired = (expires: Date): boolean => {
  return new Date() > expires;
};

// Mask sensitive data for logging
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth', 'webhook'];
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      if (typeof masked[key] === 'string') {
        masked[key] = '*'.repeat(Math.min(masked[key].length, 8));
      } else {
        masked[key] = '[REDACTED]';
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });
  
  return masked;
};
