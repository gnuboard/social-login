import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export async function extractThumbnailFromContent(content: string): Promise<Buffer | null> {
  console.log('Content type:', typeof content);
  if (typeof content !== 'string') {
    console.log('Invalid content type:', content);
    return null;
  }

  try {
    const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/;
    const match = content.match(imgRegex);
    
    if (!match || !match[1]) return null;
    
    const src = match[1];
    
    if (src.startsWith('data:image')) {
      const base64Data = src.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    
    return null;
  } catch (error) {
    console.error('Error in extractThumbnailFromContent:', error);
    return null;
  }
}

export function getThumbnailPath(): { uploadDir: string, yearMonthPath: string } {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonthPath = `${year}${month}`;
  
  const baseUploadDir = path.join(process.cwd(), 'public/thumbs');
  const uploadDir = path.join(baseUploadDir, yearMonthPath);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  return { uploadDir, yearMonthPath };
}

async function resizeImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize({
      width: 200,
      height: 200,
      fit: 'cover',
      position: 'left top'
    })
    .jpeg({ quality: 100 })
    .toBuffer();
}

export async function createThumbnail(content: string): Promise<string | null> {
  const imageBuffer = await extractThumbnailFromContent(content);
  if (!imageBuffer) return null;
  
  const { uploadDir, yearMonthPath } = getThumbnailPath();
  const resizedBuffer = await resizeImage(imageBuffer);
  const fileName = `thumb_${Date.now()}.png`;
  const filePath = path.join(uploadDir, fileName);
  
  fs.writeFileSync(filePath, resizedBuffer);
  return `/thumbs/${yearMonthPath}/${fileName}`;
}

export async function deleteThumbnail(thumbnailPath: string | null) {
  if (!thumbnailPath) return;
  
  const fullPath = path.join(process.cwd(), 'public', thumbnailPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
} 