/**
 * Multer Upload Middleware
 * Handles file upload with validation (MIME type, size)
 *
 * NOTE: Multer processes the file BEFORE all body fields are parsed.
 * So req.body.entityType may not be available when `destination` runs.
 * We upload to a staging dir first, then the service moves the file
 * to the correct entity subdirectory.
 */
import multer from 'multer';
export declare const UPLOAD_BASE: string;
/**
 * Configured multer instance
 */
export declare const upload: multer.Multer;
/**
 * Single file upload middleware
 */
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=upload.d.ts.map