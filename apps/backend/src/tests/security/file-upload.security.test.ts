/**
 * Security Tests: File Upload Attack Vectors
 *
 * Tests resistance to:
 * - MIME type bypass (executable content with image extension)
 * - File size limit enforcement
 * - Path traversal in filename
 * - Double extension attacks (file.php.jpg)
 * - Null byte in filename
 *
 * Related: #244, #248
 */
import { api, authHeader } from '../helpers/test-utils';
import path from 'path';

const auth = authHeader('ADMIN');
const UPLOAD_ENDPOINT = '/api/attachments';

/**
 * Helper: create a multipart upload request with a buffer as the file.
 */
function uploadFile(
  filename: string,
  content: Buffer | string,
  mimeType: string,
  fields: Record<string, string> = {}
) {
  const req = api
    .post(UPLOAD_ENDPOINT)
    .set(auth);

  // Attach file
  req.attach('file', Buffer.isBuffer(content) ? content : Buffer.from(content), {
    filename,
    contentType: mimeType,
  });

  // Attach form fields
  for (const [key, value] of Object.entries(fields)) {
    req.field(key, value);
  }

  return req;
}

const DEFAULT_FIELDS = {
  entityType: 'RESERVATION',
  entityId: '00000000-0000-0000-0000-000000000001',
  category: 'OTHER',
};

describe('Security: File Upload Attack Vectors', () => {
  // =========================================
  // 1. MIME Type Bypass
  // =========================================
  describe('MIME type bypass', () => {
    it('should reject file with executable content claiming to be JPEG', async () => {
      // PHP script disguised as JPEG
      const phpContent = '<?php echo shell_exec($_GET["cmd"]); ?>';

      const res = await uploadFile(
        'innocent.jpg',
        phpContent,
        'application/x-php',
        DEFAULT_FIELDS
      );

      // Server should reject based on MIME type validation
      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    });

    it('should reject executable MIME type even with image extension', async () => {
      const res = await uploadFile(
        'image.png',
        'MZ\x90\x00', // PE executable magic bytes
        'application/x-executable',
        DEFAULT_FIELDS
      );

      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    });

    it('should reject text/html disguised as image', async () => {
      const htmlContent = '<html><script>alert("xss")</script></html>';

      const res = await uploadFile(
        'photo.jpg',
        htmlContent,
        'text/html',
        DEFAULT_FIELDS
      );

      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    });

    it('should reject application/javascript upload', async () => {
      const res = await uploadFile(
        'script.js',
        'alert(document.cookie)',
        'application/javascript',
        DEFAULT_FIELDS
      );

      expect(res.status).not.toBe(200);
      expect(res.status).not.toBe(201);
    });

    it('should accept valid MIME types (image/jpeg)', async () => {
      // Minimal valid JPEG (SOI marker + minimal data)
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9,
      ]);

      const res = await uploadFile(
        'valid-photo.jpg',
        jpegBuffer,
        'image/jpeg',
        DEFAULT_FIELDS
      );

      // Should be accepted (201) or fail for other reasons (e.g. entity not found)
      // but NOT rejected for MIME type
      expect(res.status).not.toBe(415); // Unsupported Media Type
    });
  });

  // =========================================
  // 2. File Size Limits
  // =========================================
  describe('File size limits', () => {
    it('should reject file larger than 25MB limit', async () => {
      // Create a buffer slightly over 25MB
      const oversizedBuffer = Buffer.alloc(26 * 1024 * 1024, 'A');

      const res = await uploadFile(
        'large-file.pdf',
        oversizedBuffer,
        'application/pdf',
        DEFAULT_FIELDS
      );

      // Should be rejected — either 413 (Payload Too Large) or 400
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect([200, 201]).not.toContain(res.status);
    }, 30_000);

    it('should handle zero-byte file gracefully', async () => {
      const res = await uploadFile(
        'empty.pdf',
        Buffer.alloc(0),
        'application/pdf',
        DEFAULT_FIELDS
      );

      // Should not crash — may accept or reject
      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 3. Path Traversal in Filename
  // =========================================
  describe('Path traversal in filename', () => {
    const TRAVERSAL_FILENAMES = [
      '../../etc/passwd',
      '../../../etc/shadow',
      '..\\..\\windows\\system32\\config\\sam',
      '....//....//etc/passwd',
      'file.jpg/../../etc/passwd',
    ];

    it.each(TRAVERSAL_FILENAMES)(
      'should sanitize path traversal in filename: %s',
      async (maliciousFilename) => {
        const res = await uploadFile(
          maliciousFilename,
          Buffer.from('test content'),
          'application/pdf',
          DEFAULT_FIELDS
        );

        // Should not crash (500) — either reject or sanitize filename
        expect(res.status).not.toBe(500);

        // If upload succeeded, verify stored filename does not contain traversal
        if (res.status === 200 || res.status === 201) {
          const responseBody = JSON.stringify(res.body);
          expect(responseBody).not.toContain('../');
          expect(responseBody).not.toContain('..\\');
          expect(responseBody).not.toContain('/etc/passwd');
        }
      }
    );

    it('should sanitize URL-encoded path traversal: ..%2F..%2F', async () => {
      const res = await uploadFile(
        '..%2F..%2Fetc%2Fpasswd',
        Buffer.from('test content'),
        'application/pdf',
        DEFAULT_FIELDS
      );

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 4. Double Extension Attacks
  // =========================================
  describe('Double extension attacks', () => {
    // NOTE: path.extname() returns the LAST extension, so these pass
    // extension validation (.jpg, .png, .pdf, .docx). The server's UUID
    // renaming ensures the dangerous first extension is never preserved.
    const DOUBLE_EXTENSIONS = [
      'malware.php.jpg',
      'shell.asp.png',
      'exploit.exe.pdf',
      'backdoor.jsp.docx',
      'payload.cgi.png',
    ];

    it.each(DOUBLE_EXTENSIONS)(
      'should handle double extension filename safely: %s',
      async (filename) => {
        const res = await uploadFile(
          filename,
          Buffer.from('fake content'),
          'image/jpeg',
          DEFAULT_FIELDS
        );

        // Should not crash — file processing should handle this safely
        expect(res.status).not.toBe(500);

        // If stored, verify the dangerous first extension is not preserved as executable
        if (res.status === 200 || res.status === 201) {
          const storedFilename = res.body?.data?.storedFilename || res.body?.data?.filename || '';
          // The stored filename should be a UUID, not the original dangerous name
          if (storedFilename) {
            expect(storedFilename).not.toContain('.php');
            expect(storedFilename).not.toContain('.asp');
            expect(storedFilename).not.toContain('.exe');
            expect(storedFilename).not.toContain('.jsp');
            expect(storedFilename).not.toContain('.cgi');
          }
        }
      }
    );
  });

  // =========================================
  // 5. Null Byte in Filename
  // =========================================
  describe('Null byte in filename', () => {
    it('should handle null byte injection in filename: file.jpg[NUL].php', async () => {
      // Null byte truncation attack — use URL-encoded version since raw \x00
      // causes HTTP header errors in supertest/node http
      const res = await uploadFile(
        'file.jpg%00.php',
        Buffer.from('fake content'),
        'image/jpeg',
        DEFAULT_FIELDS
      );

      // Should not crash
      expect(res.status).not.toBe(500);

      // If stored, verify no .php extension
      if (res.status === 200 || res.status === 201) {
        const storedFilename = res.body?.data?.storedFilename || '';
        if (storedFilename) {
          expect(storedFilename).not.toContain('.php');
        }
      }
    });

    it('should handle URL-encoded null byte: file.jpg%00.exe', async () => {
      const res = await uploadFile(
        'file.jpg%00.exe',
        Buffer.from('fake content'),
        'image/jpeg',
        DEFAULT_FIELDS
      );

      expect(res.status).not.toBe(500);
    });
  });

  // =========================================
  // 6. File Extension Validation (#436)
  // =========================================
  describe('File extension validation', () => {
    const BLOCKED_EXTENSIONS = [
      { ext: 'script.js', mime: 'application/javascript' },
      { ext: 'shell.sh', mime: 'application/x-sh' },
      { ext: 'backdoor.php', mime: 'application/x-php' },
      { ext: 'exploit.exe', mime: 'application/octet-stream' },
      { ext: 'payload.bat', mime: 'application/x-msdos-program' },
      { ext: 'hack.py', mime: 'text/x-python' },
      { ext: 'trojan.html', mime: 'text/html' },
    ];

    it.each(BLOCKED_EXTENSIONS)(
      'should reject file with disallowed extension: $ext',
      async ({ ext, mime }) => {
        const res = await uploadFile(
          ext,
          Buffer.from('malicious content'),
          mime,
          DEFAULT_FIELDS
        );

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect([200, 201]).not.toContain(res.status);
      }
    );

    const ALLOWED_EXTENSIONS_LIST = [
      { filename: 'photo.jpg', mime: 'image/jpeg' },
      { filename: 'photo.jpeg', mime: 'image/jpeg' },
      { filename: 'image.png', mime: 'image/png' },
      { filename: 'animation.gif', mime: 'image/gif' },
      { filename: 'modern.webp', mime: 'image/webp' },
      { filename: 'document.pdf', mime: 'application/pdf' },
      { filename: 'report.doc', mime: 'application/msword' },
      { filename: 'report.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { filename: 'data.xls', mime: 'application/vnd.ms-excel' },
      { filename: 'data.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { filename: 'export.csv', mime: 'text/csv' },
    ];

    it.each(ALLOWED_EXTENSIONS_LIST)(
      'should NOT reject allowed extension: $filename',
      async ({ filename, mime }) => {
        const res = await uploadFile(
          filename,
          Buffer.from('test content'),
          mime,
          DEFAULT_FIELDS
        );

        // Should not be rejected for MIME/extension reasons (415)
        // May fail for other reasons (entity not found = 404, etc.)
        expect(res.status).not.toBe(415);
        expect(res.status).not.toBe(500);
      }
    );

    it('should reject file with no extension', async () => {
      const res = await uploadFile(
        'Makefile',
        Buffer.from('test content'),
        'application/octet-stream',
        DEFAULT_FIELDS
      );

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect([200, 201]).not.toContain(res.status);
    });
  });

  // =========================================
  // 7. Missing Required Fields
  // =========================================
  describe('Upload without required form fields', () => {
    it('should reject upload without entityType', async () => {
      const res = await uploadFile(
        'test.pdf',
        Buffer.from('test'),
        'application/pdf',
        { entityId: '00000000-0000-0000-0000-000000000001', category: 'OTHER' }
      );

      expect(res.status).not.toBe(500);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject upload without file', async () => {
      const res = await api
        .post(UPLOAD_ENDPOINT)
        .set(auth)
        .field('entityType', 'RESERVATION')
        .field('entityId', '00000000-0000-0000-0000-000000000001')
        .field('category', 'OTHER');

      expect(res.status).not.toBe(500);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
