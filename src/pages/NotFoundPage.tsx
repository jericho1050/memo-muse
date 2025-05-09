import { Link } from 'react-router-dom';
import { FolderX } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <FolderX className="h-20 w-20 text-gray-400 mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;