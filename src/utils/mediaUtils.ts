import ExifReader from 'exifreader';
import { format } from 'date-fns';
import { Media } from '../lib/supabase';

export async function extractExifData(file: File) {
  try {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      // For videos, we'd use different techniques to extract metadata
      // But for this MVP, we'll just use the file's last modified date
      return {
        taken_at: new Date(file.lastModified).toISOString(),
        location: 'Unknown location', // Placeholder
      };
    }
    
    // Read EXIF data from image
    const tags = await ExifReader.load(file);
    
    // Extract date information
    let takenAt = new Date().toISOString();
    
    if (tags.DateTimeOriginal) {
      // Format: YYYY:MM:DD HH:MM:SS
      const dateStr = tags.DateTimeOriginal.description;
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split(':');
      const [hour, minute, second] = timePart.split(':');
      
      takenAt = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      ).toISOString();
    } else if (file.lastModified) {
      takenAt = new Date(file.lastModified).toISOString();
    }
    
    // Extract location (GPS) information
    let location = 'Unknown location'; // Default placeholder
    
    if (tags.GPSLatitude && tags.GPSLongitude) {
      const lat = tags.GPSLatitude.description;
      const lng = tags.GPSLongitude.description;
      
      // For MVP, we'll just combine the raw coordinates
      // In a full implementation, you'd use reverse geocoding
      location = `${lat}, ${lng}`;
    }
    
    // Get image dimensions if available
    let width, height;
    if (tags.ImageWidth && tags.ImageHeight) {
      width = tags.ImageWidth.value;
      height = tags.ImageHeight.value;
    }
    
    return {
      taken_at: takenAt,
      location,
      width,
      height,
    };
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    // Fallback to file metadata
    return {
      taken_at: new Date(file.lastModified).toISOString(),
      location: 'Unknown location', // Placeholder
    };
  }
}

/**
 * Groups media items by date
 */
export function groupMediaByDate(mediaItems: Media[]) {
  const groupedByDate: Record<string, Media[]> = {};
  
  mediaItems.forEach(item => {
    const dateStr = item.taken_at 
      ? new Date(item.taken_at).toISOString().split('T')[0]
      : 'Unknown';
    
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    
    groupedByDate[dateStr].push(item);
  });
  
  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return b.localeCompare(a);
  });
  
  return sortedDates.map(date => {
    let displayDate = 'Unknown Date';
    
    if (date !== 'Unknown') {
      const dateObj = new Date(date);
      displayDate = dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return {
      date,
      displayDate,
      items: groupedByDate[date]
    };
  });
}

export function createThumbnailUrl(filePath: string) {
  // In a real implementation, you might have a resizing service
  // For MVP, we'll just use the original file
  return filePath;
}

/**
 * Constructs a full media URL for Supabase storage items
 */
export function constructMediaUrl(mediaPath: string | null | undefined): string {
  if (!mediaPath) return '';
  
  // If the URL is already absolute, return it
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // For Supabase Storage URLs
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) {
    console.error('VITE_SUPABASE_URL not defined in environment variables');
    return '';
  }
  
  // Construct proper storage URL
  return `${SUPABASE_URL}/storage/v1/object/public/${mediaPath}`;
}

/**
 * Maps file extensions to proper MIME types
 * Some browsers need help with the correct MIME types
 */
export function getProperMimeType(fileType: string | null | undefined, fileName: string | null | undefined): string {
  if (!fileType && !fileName) return 'video/mp4'; // Default fallback
  
  // If we have a file type, try to use it first
  if (fileType) {
    // Handle specific cases where the stored MIME type might be incorrect
    if (fileType === 'video/quicktime') return 'video/mp4';
    return fileType;
  }
  
  // If no file type but we have a file name, guess from extension
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp4': return 'video/mp4';
      case 'mov': return 'video/mp4'; // Convert MOV to MP4 equivalent for browser
      case 'webm': return 'video/webm';
      case 'avi': return 'video/x-msvideo';
      case 'wmv': return 'video/x-ms-wmv';
      case 'flv': return 'video/x-flv';
      case 'mpeg': 
      case 'mpg': return 'video/mpeg';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }
  
  return 'application/octet-stream';
}

/**
 * Checks if a file is a supported video format for web browsers
 */
export function isSupportedVideoFormat(fileType: string | null | undefined, fileName: string | null | undefined): boolean {
  const mimeType = getProperMimeType(fileType, fileName);
  
  // Common web-supported video formats
  const supportedFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];
  
  return supportedFormats.includes(mimeType);
}

/**
 * Checks if a video format might require conversion or special handling
 */
export function needsConversion(fileType: string | null | undefined, fileName: string | null | undefined): boolean {
  if (!fileType && !fileName) return false;
  
  // Check file type first
  if (fileType === 'video/quicktime') return true;
  
  // Check by extension if available
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'mov' || ext === 'avi' || ext === 'wmv' || ext === 'flv';
  }
  
  return false;
}