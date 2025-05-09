import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaUploader from '../components/MediaUploader';

function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/gallery')}
          className="text-gray-500 hover:text-gray-700 mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upload Media</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <MediaUploader />
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Tips for better uploads</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Photos with EXIF data will automatically be organized by date and location</li>
          <li>• Supported formats: JPG, PNG, GIF, MP4, MOV</li>
          <li>• Maximum file size: 20MB per file</li>
          <li>• For best results, use high-quality images with good lighting</li>
        </ul>
      </div>
    </div>
  );
}

export default UploadPage;