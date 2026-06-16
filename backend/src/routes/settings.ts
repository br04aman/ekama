import express from 'express';
import multer from 'multer';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { getStoreSettingsCollection } from '../utils/database';

const router = express.Router();

// Use memory storage for Cloudinary uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (increased for Cloudinary)
});

const uploadVideo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});

// Public route to get home page layout settings
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const settings = getStoreSettingsCollection();
        const doc = await settings.findOne({ id });

        if (!doc) {
            res.status(404).json({ error: 'Settings not found' });
            return;
        }

        res.json(doc);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Admin ONLY route to handle file uploads for settings
router.post('/upload', authenticate, authorizeAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const uploadedFiles = (req.files || []) as Express.Multer.File[];
        
        // Upload all files to Cloudinary
        const uploadResults = await Promise.all(
            uploadedFiles.map(file => uploadMulterFile(file, {
                folder: 'ekama/settings',
                resource_type: 'image'
            }))
        );
        
        const imageUrls = uploadResults.map(result => result.secure_url);
        res.status(200).json({ urls: imageUrls });
        return;
    } catch (error) {
        console.error('Failed to upload image:', error);
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            error: 'Failed to process image upload',
            message: process.env.NODE_ENV === 'production' ? undefined : message
        });
    }
});

// Admin ONLY route to handle video uploads for settings
router.post('/upload/video', authenticate, authorizeAdmin, uploadVideo.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file provided' });
            return;
        }
        
        // Upload video to Cloudinary
        const uploadResult = await uploadMulterFile(req.file, {
            folder: 'ekama/settings',
            resource_type: 'video'
        });
        
        res.status(200).json({ url: uploadResult.secure_url });
        return;
    } catch (error) {
        console.error('Failed to upload video:', error);
        res.status(500).json({ error: 'Failed to process video upload' });
    }
});

// Admin ONLY route to update layout settings
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove system fields to prevent tampering
        delete updateData._id;
        delete updateData.id;
        delete updateData.createdAt;

        updateData.updatedAt = new Date();

        const settings = getStoreSettingsCollection();
        const result = await settings.findOneAndUpdate(
            { id },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            res.status(404).json({ error: 'Settings not found' });
            return;
        }

        res.json(result);
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
