import ExifReader from 'exifreader';
import { format } from 'date-fns';

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

export function groupMediaByDate(mediaItems: any[]) {
  const groups = mediaItems.reduce((acc, item) => {
    if (!item.taken_at) return acc;
    
    // Format the date to group by (YYYY-MM-DD)
    const dateKey = item.taken_at.substring(0, 10);
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(item);
    return acc;
  }, {});
  
  // Convert to array of groups sorted by date (newest first)
  return Object.entries(groups)
    .map(([date, items]) => ({
      date,
      displayDate: format(new Date(date), 'MMMM d, yyyy'),
      items,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function createThumbnailUrl(filePath: string) {
  // In a real implementation, you might have a resizing service
  // For MVP, we'll just use the original file
  return filePath;
}