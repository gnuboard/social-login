import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export async function extractThumbnailFromContent(content: string): Promise<Buffer | null> {
  const base64Regex = /<img[^>]*src="(data:image\/[^"]+)"[^>]*>/;
  const match = content.match(base64Regex);
  
  if (match && match[1]) {
    const base64Data = match[1].replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }
  return null;
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