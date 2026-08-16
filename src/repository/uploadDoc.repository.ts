import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Create uploads directory if it doesn't exist
const uploadPath = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

async function uploadFile(file: any, companyId: string = 'global'): Promise<string> {
  try {
    // Generate unique file name without external packages
    const rawExtName = file.originalname || file.filename || 'unknown';
    // Remove spaces and special characters (keep alphanumeric, dot, hyphen, underscore)
    const extName = rawExtName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    const ext = extName.includes('.') ? `.${extName.split('.').pop()}` : '.png';
    const random10Chars = Math.random().toString(36).substring(2, 12);
    const uniqueFilename = `${companyId}-${random10Chars}-${extName}`;
    
    // Write file to local folder
    const filePath = path.join(uploadPath, uniqueFilename);
    
    // Check if buffer is a base64 data URI string and decode it
    let fileData = file.buffer;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1];
      if (base64Data) {
        fileData = Buffer.from(base64Data, 'base64');
      }
    }
    
    fs.writeFileSync(filePath, fileData);

    // Return the URL for the frontend
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 9098}`;
    return `${baseUrl}/uploads/${uniqueFilename}`;
  } catch (error: any) {
    console.log(error?.message);
    throw new Error('Failed to upload file locally');
  }
}

async function deleteFile(fileNameOrUrl: string): Promise<boolean> {
  console.log(`[deleteFile] called with:`, fileNameOrUrl);
  try {
    if (!fileNameOrUrl) {
      console.log(`[deleteFile] No fileName or URL provided!`);
      return false;
    }
    // Extract filename from the end of the URL and decode URI components (e.g. %20 -> space)
    const rawFileName = fileNameOrUrl.split('/').pop() || '';
    const fileName = decodeURIComponent(rawFileName);
    if (!fileName) return false;

    // Delete file if it exists
    const filePath = path.join(uploadPath, fileName);
    console.log(`[deleteFile] Attempting to delete: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[deleteFile] Successfully deleted: ${filePath}`);
      return true;
    } else {
      console.log(`[deleteFile] File not found on disk: ${filePath}`);
    }
    return false;
  } catch (error: any) {
    console.log(`[deleteFile] Error: ${error?.message}`);
    return false;
  }
}

export { uploadFile, deleteFile };
