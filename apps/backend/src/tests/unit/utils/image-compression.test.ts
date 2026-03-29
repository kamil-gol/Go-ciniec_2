import { compressIfImage, CompressionResult } from '../../../utils/image-compression';

jest.mock('sharp', () => {
  let callCount = 0;
  const mockSharp = jest.fn(() => {
    callCount++;
    if (callCount % 2 === 1) {
      // First call: input image pipeline
      return {
        metadata: jest.fn().mockResolvedValue({ width: 3000, height: 2000, format: 'jpeg' }),
        rotate: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.alloc(500)),
      };
    } else {
      // Second call: output metadata inspection
      return {
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1333, format: 'jpeg' }),
      };
    }
  });
  return { __esModule: true, default: mockSharp };
});

jest.mock('../../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('compressIfImage', () => {
  const imageBuffer = Buffer.alloc(10000);

  it('should compress JPEG images', async () => {
    const result = await compressIfImage(imageBuffer, 'image/jpeg', 'photo.jpg');
    expect(result.wasCompressed).toBe(true);
    expect(result.originalSize).toBe(10000);
    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
  });

  it('should compress PNG images', async () => {
    const result = await compressIfImage(imageBuffer, 'image/png', 'photo.png');
    expect(result.wasCompressed).toBe(true);
  });

  it('should compress WebP images', async () => {
    const result = await compressIfImage(imageBuffer, 'image/webp', 'photo.webp');
    expect(result.wasCompressed).toBe(true);
  });

  it('should pass through non-image files unchanged', async () => {
    const pdfBuffer = Buffer.from('PDF content');
    const result = await compressIfImage(pdfBuffer, 'application/pdf', 'doc.pdf');
    expect(result.wasCompressed).toBe(false);
    expect(result.buffer).toBe(pdfBuffer);
    expect(result.originalSize).toBe(pdfBuffer.length);
    expect(result.compressedSize).toBe(pdfBuffer.length);
  });

  it('should pass through text files unchanged', async () => {
    const textBuffer = Buffer.from('text');
    const result = await compressIfImage(textBuffer, 'text/plain', 'readme.txt');
    expect(result.wasCompressed).toBe(false);
  });

  it('should return CompressionResult interface', async () => {
    const result = await compressIfImage(imageBuffer, 'image/jpeg', 'test.jpg');
    expect(result).toHaveProperty('buffer');
    expect(result).toHaveProperty('originalSize');
    expect(result).toHaveProperty('compressedSize');
    expect(result).toHaveProperty('wasCompressed');
  });
});
