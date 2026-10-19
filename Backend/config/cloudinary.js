import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

let isConfigured = false;

export const isCloudinaryConfigured = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    if (!isConfigured) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      isConfigured = true;
      console.log('[Cloudinary] Configured successfully.');
    }
    return true;
  }
  return false;
};

// Initial check
isCloudinaryConfigured();

/**
 * Upload buffer to Cloudinary or local storage
 * @param {Buffer} buffer 
 * @param {String} folder 
 * @param {String} filename 
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadBufferToStorage = async (buffer, folder = 'event_registrations', filename = '') => {
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'image',
            timeout: 25000,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        );
        Readable.from(buffer).pipe(uploadStream);
      });
      return uploadResult;
    } catch (cloudErr) {
      console.warn(
        `[Cloudinary Upload Warning]: ${cloudErr.message}. Automatically falling back to local server storage so registration succeeds.`,
      );
    }
  }

  // Fallback to local storage
  const uploadDir = path.resolve('public/uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cleanFilename = `${Date.now()}_${(filename || 'upload.png').replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, cleanFilename);
  fs.writeFileSync(filePath, buffer);

  const localUrl = `/uploads/${folder}/${cleanFilename}`;
  return {
    url: localUrl,
    publicId: `local_${cleanFilename}`,
  };
};

/**
 * Delete image from Cloudinary or local storage
 * @param {String} publicId 
 */
export const deleteStorageImage = async (publicId) => {
  if (!publicId) return;

  if (isCloudinaryConfigured() && !publicId.startsWith('local_')) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn('[Cloudinary] Delete error:', err.message);
    }
  } else if (publicId.startsWith('local_')) {
    const filename = publicId.replace('local_', '');
    // Scan uploads directory to remove file if exists
    try {
      const uploadsDir = path.resolve('public/uploads');
      const files = fs.readdirSync(uploadsDir, { recursive: true });
      for (const file of files) {
        if (typeof file === 'string' && file.endsWith(filename)) {
          const fullPath = path.join(uploadsDir, file);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }
      }
    } catch (e) {
      // ignore local delete failure
    }
  }
};

export default cloudinary;
