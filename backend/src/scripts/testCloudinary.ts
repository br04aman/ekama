/**
 * Test script to verify Cloudinary connection
 * Run with: npx ts-node src/scripts/testCloudinary.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 __dirname:', __dirname);

// Try all possible paths
const possiblePaths = [
  path.resolve(__dirname, '../../../.env'), // Up 3 from src/scripts
  path.resolve(__dirname, '../../../../.env'), // Up 4 from src/scripts
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve('c:/Users/br04a/Downloads/ekama-lov/ekama/.env'),
];

console.log('🔍 Trying paths:');
possiblePaths.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p} (exists: ${fs.existsSync(p)})`);
});

// Find first existing .env
let envLoaded = false;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    console.log(`✅ Loading from ${p}`);
    dotenv.config({ path: p });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('❌ Could not find .env file in any location!');
  process.exit(1);
}

import { v2 as cloudinary } from 'cloudinary';

async function testCloudinaryConnection(): Promise<void> {
  console.log('🧪 Testing Cloudinary Connection...\n');

  // Check if environment variables are set
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  console.log('📋 Environment Variables:');
  console.log(`  CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Not set'}`);
  console.log(`  CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`  CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set (hidden)' : '❌ Not set'}`);
  console.log(`  CLOUDINARY_URL: ${cloudinaryUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`  CLOUDINARY_URL value: ${cloudinaryUrl}`);
  console.log('');

  // Configure Cloudinary
  try {
    if (cloudinaryUrl) {
      // Parse CLOUDINARY_URL explicitly to avoid env var caching issues
      const url = new URL(cloudinaryUrl);
      const cloudNameFromUrl = url.hostname;
      const apiKeyFromUrl = url.username;
      const apiSecretFromUrl = url.password;

      console.log('🔍 Parsing CLOUDINARY_URL:');
      console.log(`   Cloud Name: ${cloudNameFromUrl}`);
      console.log(`   API Key: ${apiKeyFromUrl}`);

      cloudinary.config({
        cloud_name: cloudNameFromUrl,
        api_key: apiKeyFromUrl,
        api_secret: apiSecretFromUrl,
        secure: true,
      });
      console.log('✅ Cloudinary configured via CLOUDINARY_URL');
    } else if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      console.log('✅ Cloudinary configured via individual credentials');
    } else {
      console.error('❌ Missing Cloudinary credentials. Please check your .env file.');
      process.exit(1);
    }

    console.log('');

    // Test connection by getting account info
    console.log('🔍 Testing Cloudinary API connection...');
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection successful!');
      console.log(`   Status: ${result.status}`);
    } else {
      console.log('⚠️ Unexpected response:', result);
    }

    // Get account details
    console.log('\n📊 Account Details:');
    const usage = await cloudinary.api.usage();
    console.log(`   Plan: ${usage.plan || 'Unknown'}`);
    console.log(`   Storage Used: ${(usage.storage?.usage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Transformations: ${usage.transformations?.usage || 0}`);
    console.log(`   Bandwidth: ${(usage.bandwidth?.usage / 1024 / 1024 / 1024).toFixed(2)} GB`);

    console.log('\n✅ All tests passed! Cloudinary is ready to use.');

  } catch (error: any) {
    console.error('\n❌ Cloudinary connection failed!');
    console.error('Error:', error.message || error);
    
    if (error.http_code === 401) {
      console.error('\n💡 Tip: Invalid API credentials. Please check:');
      console.error('   1. Your Cloudinary API Key is correct');
      console.error('   2. Your API Secret is correct');
      console.error('   3. Your Cloud Name is correct');
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudinaryConnection().then(() => process.exit(0));
