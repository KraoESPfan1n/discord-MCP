#!/usr/bin/env node

/**
 * Secret Generation Script
 * Generates secure secrets for Discord MCP Server configuration
 */

const crypto = require('crypto');

console.log('🔐 Discord MCP Server - Secret Generator');
console.log('=======================================\n');

// Generate webhook secret (32+ characters)
const webhookSecret = crypto.randomBytes(32).toString('hex');
console.log('WEBHOOK_SECRET=' + webhookSecret);

// Generate API key (16+ characters)
const apiKey = crypto.randomBytes(16).toString('hex');
console.log('API_KEY=' + apiKey);

// Generate encryption key (exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

console.log('\n📝 Copy these values to your .env file');
console.log('⚠️  Keep these secrets secure and never commit them to version control!');
console.log('\n🔧 You can also run this script anytime to generate new secrets:');
console.log('   node scripts/generate-secrets.js');
