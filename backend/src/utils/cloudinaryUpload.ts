import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
// The SDK automatically detects CLOUDINARY_URL from environment variables
// Format: cloudinary://api_key:api_secret@cloud_name
cloudinary.config({
  secure: true,
});

// Log configuration status (without exposing secrets)
if (process.env.CLOUDINARY_URL) {
  console.log('✅ Cloudinary configured via CLOUDINARY_URL');
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  console.log('✅ Cloudinary configured via individual credentials');
} else {
  console.warn('⚠️  Cloudinary not configured. Set CLOUDINARY_URL or individual credentials.');
}

// Upload options interface
export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  eager?: any[];
  tags?: string[];
  public_id?: string;
}

// Upload result interface
export interface UploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  url: string;
  secure_url: string;
  eager?: any[];
}

/**
 * Upload a buffer to Cloudinary
 */
export function uploadBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder || 'ekama/uploads',
      resource_type: options.resource_type || 'auto',
      ...options,
    };

    // Add image optimization for images
    if (options.resource_type === 'image' || options.resource_type === 'auto') {
      uploadOptions.quality = 'auto:good';
      uploadOptions.fetch_format = 'auto';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result as UploadResult);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Upload a file from disk to Cloudinary
 */
export async function uploadFile(
  filePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  return uploadBuffer(buffer, options);
}

/**
 * Upload a Multer file to Cloudinary
 * This is the main function used in route handlers
 */
export function uploadMulterFile(
  file: Express.Multer.File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Determine resource type based on mimetype
  let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
  if (file.mimetype.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.mimetype.startsWith('video/')) {
    resourceType = 'video';
  }

  return uploadBuffer(file.buffer, {
    folder: options.folder || 'ekama/uploads',
    resource_type: options.resource_type || resourceType,
    tags: ['ekama', 'upload', ...(options.tags || [])],
    ...options,
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`❌ Failed to delete from Cloudinary: ${publicId}`, error);
    throw error;
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  // Add default optimizations
  if (!options.quality) transformations.push('q_auto:good');
  if (!options.format) transformations.push('f_auto');

  const transformationString = transformations.join(',');
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
}

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)?$/);
  return match ? match[1] : null;
}

// Export configured cloudinary instance
export { cloudinary };

