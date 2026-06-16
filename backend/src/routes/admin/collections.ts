import type { Request } from 'express';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorizeAdmin } from '../../middleware/auth';
import { ApiResponse, AuthTokenPayload, Collection } from '../../types';
import { uploadMulterFile, deleteFromCloudinary, extractPublicId } from '../../utils/cloudinaryUpload';
import { getCollectionsCollection, getProductsCollection } from '../../utils/database';

const router = express.Router();

// Use memory storage since we're uploading to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', authenticate, authorizeAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    
    const uploadResult = await uploadMulterFile(req.file, {
      folder: 'ekama/collections',
      resource_type: 'image'
    });
    
    res.status(200).json({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
    return;
  } catch (error) {
    console.error('Failed to upload collection image:', error);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

type AuthenticatedRequest = Request & { user: AuthTokenPayload };

type CollectionDoc = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  slug?: string;
  productCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
};

router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  const collections = getCollectionsCollection();
  const { name, description, image, category, featured, slug } = req.body;
  const user = (req as AuthenticatedRequest).user;
  const now = new Date();

  const newCollection: CollectionDoc = {
    id: uuidv4(),
    name,
    description,
    image,
    category,
    featured: Boolean(featured),
    slug: slug || name.toLowerCase().replace(/ /g, '-'),
    productCount: 0,
    createdAt: now,
    updatedAt: now,
    updatedBy: user.email
  };

  try {
    await collections.insertOne(newCollection);
    return res.status(201).json({
      success: true,
      data: newCollection,
      message: 'Collection created successfully'
    } as ApiResponse<Collection>);
  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create collection'
    } as ApiResponse<null>);
  }
});

router.patch('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const collections = getCollectionsCollection();
  const { id } = req.params;
  const { name, description, image, category, featured, slug } = req.body;
  const user = (req as AuthenticatedRequest).user;
  const now = new Date();

  const updateData: Partial<CollectionDoc> = {
    name,
    description,
    image,
    category,
    featured: featured,
    slug: slug,
    updatedAt: now,
    updatedBy: user.email
  };

  Object.keys(updateData).forEach(key => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]);

  try {
    const result = await collections.updateOne({ id }, { $set: updateData });
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    const updatedCollection = await collections.findOne({ id });
    return res.json({
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    } as ApiResponse<Collection>);
  } catch (error) {
    console.error('Error updating collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update collection'
    } as ApiResponse<null>);
  }
});

router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  const collections = getCollectionsCollection();
  const { id } = req.params;

  try {
    const existing = await collections.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    // Delete image from Cloudinary if it's a Cloudinary URL
    if (existing.image && existing.image.includes('cloudinary.com')) {
      try {
        const publicId = extractPublicId(existing.image);
        if (publicId) {
          await deleteFromCloudinary(publicId);
          console.log(`🗑️ Deleted collection image from Cloudinary: ${publicId}`);
        }
      } catch (err) {
        console.error(`Failed to delete collection image from Cloudinary:`, err);
        // Continue with deletion even if Cloudinary delete fails
      }
    }

    const result = await collections.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    await getProductsCollection().deleteMany({ collection: id });
    return res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete collection'
    } as ApiResponse<null>);
  }
});

export default router;
