import type { Request } from 'express';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeAdmin } from '../../middleware/auth';
import { ApiResponse, AuthTokenPayload, Product } from '../../types';
import { deleteFromCloudinary, extractPublicId, uploadMulterFile } from '../../utils/cloudinaryUpload';
import { getCollectionsCollection, getProductsCollection } from '../../utils/database';

const router = express.Router();

type AuthenticatedRequest = Request & { user: AuthTokenPayload };

type ProductDoc = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  category: string;
  collection: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specifications?: Record<string, string>;
  adminProductId?: string;
  siddhAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
};

// Use memory storage since we're uploading to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
};

const parseSpecifications = (value: unknown): Record<string, string> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch {
      return {};
    }
  }
  return {};
};

const parseImageList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
};

router.post('/', authenticate, authorizeAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const products = getProductsCollection();
    const collections = getCollectionsCollection();
    const {
      name,
      description = '',
      price,
      originalPrice,
      imageUrl,
      images,
      category = '',
      collection,
      inStock = true,
      stockQuantity = 0,
      rating = 0,
      reviewCount = 0,
      adminProductId,
      siddhAvailable = false,
      tags = [],
      specifications = {}
    } = req.body || {};
    const uploadedFiles = (req.files || []) as Express.Multer.File[];

    // Upload images to Cloudinary
    const uploadResults = await Promise.all(
      uploadedFiles.map(file => uploadMulterFile(file, {
        folder: 'ekama/products',
        resource_type: 'image'
      }))
    );
    const uploadedImages = uploadResults.map((result) => result.secure_url);

    if (!name || typeof price === 'undefined' || !collection) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, collection'
      } as ApiResponse<null>);
    }

    const now = new Date();
    const user = (req as AuthenticatedRequest).user;
    const imagesArray = uploadedImages.length > 0
      ? uploadedImages
      : typeof images !== 'undefined'
        ? parseImageList(images)
        : imageUrl
          ? [String(imageUrl).trim()]
          : [];
    const inStockValue = typeof inStock === 'string' ? inStock === 'true' : Boolean(inStock);

    const newProduct: ProductDoc = {
      id: uuidv4(),
      name,
      description,
      price: Number(price),
      originalPrice: typeof originalPrice !== 'undefined' ? Number(originalPrice) : undefined,
      images: imagesArray,
      category,
      collection,
      inStock: inStockValue,
      stockQuantity: Number(stockQuantity),
      rating: Number(rating) || 0,
      reviewCount: Number(reviewCount) || 0,
      tags: parseTags(tags),
      adminProductId: adminProductId ? String(adminProductId) : undefined,
      siddhAvailable: typeof siddhAvailable === 'string' ? siddhAvailable === 'true' : Boolean(siddhAvailable),
      specifications: parseSpecifications(specifications),
      createdAt: now,
      updatedAt: now,
      updatedBy: user?.email || 'unknown'
    };

    await products.insertOne(newProduct);
    if (collection) {
      await collections.updateOne(
        { id: collection },
        { $inc: { productCount: 1 }, $set: { updatedAt: now } }
      );
    }
    return res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    } as ApiResponse<Product>);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create product'
    } as ApiResponse<null>);
  }
});

router.patch('/:id', authenticate, authorizeAdmin, upload.array('images', 5), async (req, res) => {
  const products = getProductsCollection();
  const { id } = req.params;
  const {
    name,
    description,
    price,
    originalPrice,
    imageUrl,
    images,
    existingImages,
    category,
    collection,
    inStock,
    stockQuantity,
    rating,
    reviewCount,
    adminProductId,
    siddhAvailable,
    tags,
    specifications
  } = req.body || {};
  const uploadedFiles = (req.files || []) as Express.Multer.File[];

  // First get the existing product to keep existing images if needed
  const existingProduct = await products.findOne({ id });
  if (!existingProduct) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  // Upload new images to Cloudinary if any
  let uploadedImages: string[] = [];
  if (uploadedFiles.length > 0) {
    const uploadResults = await Promise.all(
      uploadedFiles.map(file => uploadMulterFile(file, {
        folder: 'ekama/products',
        resource_type: 'image'
      }))
    );
    uploadedImages = uploadResults.map((result) => result.secure_url);
  }

  const updates: Partial<ProductDoc> = {};
  const unset: Record<string, ''> = {};
  const now = new Date();
  const user = (req as AuthenticatedRequest).user;

  if (typeof name !== 'undefined') updates.name = name;
  if (typeof description !== 'undefined') updates.description = description;
  if (typeof price !== 'undefined') updates.price = Number(price);
  if (typeof originalPrice !== 'undefined') {
    if (originalPrice === null) {
      unset.originalPrice = '';
    } else {
      updates.originalPrice = Number(originalPrice);
    }
  }
  if (typeof category !== 'undefined') updates.category = category;
  if (typeof collection !== 'undefined') updates.collection = collection;
  if (typeof inStock !== 'undefined') {
    updates.inStock = typeof inStock === 'string' ? inStock === 'true' : Boolean(inStock);
  }
  if (typeof rating !== 'undefined') updates.rating = Number(rating) || 0;
  if (typeof reviewCount !== 'undefined') updates.reviewCount = Number(reviewCount) || 0;
  if (typeof tags !== 'undefined') updates.tags = parseTags(tags);
  if (typeof adminProductId !== 'undefined') updates.adminProductId = adminProductId ? String(adminProductId) : undefined;
  if (typeof siddhAvailable !== 'undefined') {
    updates.siddhAvailable = typeof siddhAvailable === 'string' ? siddhAvailable === 'true' : Boolean(siddhAvailable);
  }
  if (typeof specifications !== 'undefined') updates.specifications = parseSpecifications(specifications);

  // Handle images properly: if we uploaded new ones, use them; else keep existing
  if (uploadedImages.length > 0) {
    updates.images = uploadedImages;
  } else if (typeof images !== 'undefined') {
    updates.images = parseImageList(images);
  } else if (typeof imageUrl !== 'undefined') {
    updates.images = imageUrl ? [String(imageUrl).trim()] : [];
  } else if (typeof existingImages !== 'undefined') {
    updates.images = parseImageList(existingImages);
  }
  // If no new images provided, don't change images field (keep existing)

  if (Object.keys(updates).length === 0 && Object.keys(unset).length === 0) {
    return res.status(400).json({ success: false, error: 'No updatable fields provided' } as ApiResponse<null>);
  }
  updates.updatedAt = now;
  updates.updatedBy = user?.email || 'unknown';

  const updatePayload: { $set: Partial<ProductDoc>; $unset?: Record<string, ''> } = { $set: updates };
  if (Object.keys(unset).length > 0) {
    updatePayload.$unset = unset;
  }

  try {
    const result = await products.updateOne({ id }, updatePayload);
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const updatedProduct = await products.findOne({ id });
    return res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    } as ApiResponse<Product>);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update product'
    } as ApiResponse<null>);
  }
});

router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const products = getProductsCollection();
  const collections = getCollectionsCollection();
  const { id } = req.params;
  const now = new Date();

  try {
    const existing = await products.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Delete images from Cloudinary
    if (existing.images && Array.isArray(existing.images)) {
      for (const imageUrl of existing.images) {
        try {
          if (imageUrl && imageUrl.includes('cloudinary.com')) {
            const publicId = extractPublicId(imageUrl);
            if (publicId) {
              await deleteFromCloudinary(publicId);
              console.log(`🗑️ Deleted from Cloudinary: ${publicId}`);
            }
          }
        } catch (err) {
          console.error(`Failed to delete image from Cloudinary:`, err);
          // Continue with deletion even if Cloudinary delete fails
        }
      }
    }

    const result = await products.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Product not found during deletion' });
    }

    if (existing.collection) {
      await collections.updateOne(
        { id: existing.collection },
        { $inc: { productCount: -1 }, $set: { updatedAt: now } }
      );
    }
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    } as ApiResponse<null>);
  }
});

export default router;
