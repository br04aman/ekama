/**
 * Migration script to upload existing local assets to Cloudinary
 * Run with: npx ts-node src/scripts/migrateToCloudinary.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables (same logic as preloadEnv.ts)
const envPathsToTry = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPathsToTry) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) break;
}

import { uploadFile } from '../utils/cloudinaryUpload';
import { getCollectionsCollection, getProductsCollection, initDatabase } from '../utils/database';

const uploadsDir = path.resolve(__dirname, '../../public/uploads');

interface MigrationResult {
  fileName: string;
  localPath: string;
  cloudinaryUrl: string;
  publicId: string;
  success: boolean;
  error?: string;
}

/**
 * Upload a single file to Cloudinary
 */
async function migrateFile(
  filePath: string,
  folder: string = 'ekama/migrated'
): Promise<MigrationResult> {
  const fileName = path.basename(filePath);
  
  try {
    console.log(`📤 Uploading ${fileName}...`);
    
    const result = await uploadFile(filePath, {
      folder,
      resource_type: 'auto',
      tags: ['migrated', 'ekama'],
    });

    console.log(`✅ Uploaded: ${result.secure_url}`);

    return {
      fileName,
      localPath: filePath,
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      success: true,
    };
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error);
    return {
      fileName,
      localPath: filePath,
      cloudinaryUrl: '',
      publicId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update database references from local paths to Cloudinary URLs
 */
async function updateDatabaseReferences(
  results: MigrationResult[]
): Promise<void> {
  console.log('\n🔄 Updating database references...');

  const productsCollection = getProductsCollection();
  const collectionsCollection = getCollectionsCollection();

  // Create a map of local paths to Cloudinary URLs
  const urlMap = new Map<string, string>();
  for (const result of results) {
    if (result.success) {
      const localPath = `/uploads/${result.fileName}`;
      urlMap.set(localPath, result.cloudinaryUrl);
    }
  }

  // Update products
  const products = await productsCollection.find({}).toArray();
  for (const product of products) {
    if (product.images && Array.isArray(product.images)) {
      const updatedImages = product.images.map((img: string) => {
        // Check if it's a local path
        if (img && (img.startsWith('/uploads/') || !img.startsWith('http'))) {
          // Try exact match first
          if (urlMap.has(img)) {
            return urlMap.get(img) || img;
          }
          // Try with just the filename
          const fileName = img.split('/').pop();
          const matched = results.find(r => r.fileName === fileName && r.success);
          if (matched) {
            return matched.cloudinaryUrl;
          }
        }
        return img;
      });

      // Only update if there are changes
      if (JSON.stringify(updatedImages) !== JSON.stringify(product.images)) {
        await productsCollection.updateOne(
          { id: product.id },
          { $set: { images: updatedImages, updatedAt: new Date() } }
        );
        console.log(`✅ Updated product: ${product.name}`);
      }
    }
  }

  // Update collections
  const collections = await collectionsCollection.find({}).toArray();
  for (const collection of collections) {
    if (collection.image) {
      let updatedImage = collection.image;
      
      if (collection.image.startsWith('/uploads/') || !collection.image.startsWith('http')) {
        if (urlMap.has(collection.image)) {
          updatedImage = urlMap.get(collection.image) || updatedImage;
        } else {
          const fileName = collection.image.split('/').pop();
          const matched = results.find(r => r.fileName === fileName && r.success);
          if (matched) {
            updatedImage = matched.cloudinaryUrl;
          }
        }
      }

      if (updatedImage !== collection.image) {
        await collectionsCollection.updateOne(
          { id: collection.id },
          { $set: { image: updatedImage, updatedAt: new Date() } }
        );
        console.log(`✅ Updated collection: ${collection.name}`);
      }
    }
  }

  console.log('✅ Database update complete!');
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  console.log('🚀 Starting Cloudinary Migration...\n');

  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database connected\n');

    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log('⚠️ Uploads directory not found:', uploadsDir);
      return;
    }

    // Get all files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${files.length} files in uploads directory\n`);

    // Migrate each file
    const results: MigrationResult[] = [];
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const result = await migrateFile(filePath, 'ekama/migrated');
        results.push(result);
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`  Total files: ${results.length}`);
    console.log(`  Successful: ${results.filter(r => r.success).length}`);
    console.log(`  Failed: ${results.filter(r => !r.success).length}`);

    // Update database references
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      await updateDatabaseReferences(successfulResults);
    }

    // List failed uploads
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('\n❌ Failed uploads:');
      for (const fail of failedResults) {
        console.log(`  - ${fail.fileName}: ${fail.error}`);
      }
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().then(() => process.exit(0));
}

export { runMigration };

