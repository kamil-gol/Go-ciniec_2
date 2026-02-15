/**
 * Multer Upload Middleware
 * Handles file upload with validation (MIME type, size)
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, STORAGE_DIRS, EntityType } from '../constants/attachmentCategories';
import fs from 'fs';
import logger from '../utils/logger';

const UPLOAD_BASE = path.join(process.cwd(), 'uploads');

/**
 * Ensure upload directories exist
 */
function ensureDirectories(): void {
  for (const dir of Object.values(STORAGE_DIRS)) {
    const fullPath = path.join(UPLOAD_BASE, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created upload directory: ${fullPath}`);
    }
  }
}

ensureDirectories();

/**
 * Multer storage configuration
 * Files are stored with UUID names to prevent collisions
 */
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const entityType = req.body.entityType as EntityType;
    const subDir = STORAGE_DIRS[entityType] || 'other';
    const destPath = path.join(UPLOAD_BASE, subDir);

    // Ensure directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }

    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${uuidv4()}${ext}`;
    cb(null, storedName);
  },
});

/**
 * File filter - validate MIME type
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(`Niedozwolony typ pliku: ${file.mimetype}. Dozwolone: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

/**
 * Configured multer instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Single file upload middleware
 */
export const uploadSingle = upload.single('file');
