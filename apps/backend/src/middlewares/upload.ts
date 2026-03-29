/**
 * Multer Upload Middleware
 * Handles file upload with validation (MIME type, size)
 *
 * NOTE: Multer processes the file BEFORE all body fields are parsed.
 * So req.body.entityType may not be available when `destination` runs.
 * We upload to a staging dir first, then the service moves the file
 * to the correct entity subdirectory.
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, STORAGE_DIRS } from '../constants/attachmentCategories';
import fs from 'fs';
import logger from '../utils/logger';

export const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const STAGING_DIR = path.join(UPLOAD_BASE, '_staging');

/**
 * Ensure upload directories exist
 */
function ensureDirectories(): void {
  // Staging dir for initial uploads
  if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
    logger.info(`Created staging directory: ${STAGING_DIR}`);
  }

  // Entity subdirectories
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
 * Files are uploaded to _staging/ first, then moved by the service.
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, STAGING_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${uuidv4()}${ext}`;
    cb(null, storedName);
  },
});

/**
 * Allowed file extensions (must match ALLOWED_MIME_TYPES)
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

/**
 * File filter - validate MIME type AND extension (#436)
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error(`Niedozwolone rozszerzenie pliku: ${ext}. Dozwolone: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }
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
