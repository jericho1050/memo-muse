import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Image as ImageIcon, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { extractExifData } from '../utils/mediaUtils';
import { useMediaStore } from '../store/mediaStore';

function MediaUploader() {
  const { uploadMedia, uploading } = useMediaStore();
  const [files, setFiles] = useState<Array<{ file: File; preview: string; progress: number; error?: string; uploaded?: boolean }>>([]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    maxSize: 20971520, // 20MB
  });
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].uploaded) continue;
      
      try {
        // Set the file to uploading state
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], progress: 10 };
          return newFiles;
        });
        
        // Extract EXIF data
        const metadata = await extractExifData(files[i].file);
        
        // Update progress
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], progress: 30 };
          return newFiles;
        });
        
        // Upload to Supabase
        await uploadMedia(files[i].file, metadata);
        
        // Mark as uploaded
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { 
            ...newFiles[i], 
            progress: 100,
            uploaded: true,
          };
          return newFiles;
        });
      } catch (err) {
        console.error('Upload error:', err);
        setFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { 
            ...newFiles[i], 
            progress: 0,
            error: 'Upload failed',
          };
          return newFiles;
        });
      }
      
      // Pause between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };
  
  const isAnyFileUploading = files.some(f => f.progress > 0 && f.progress < 100);
  const isAnyFileNotUploaded = files.some(f => !f.uploaded && !f.error);

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload 
            className={`h-12 w-12 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`} 
            strokeWidth={1.5} 
          />
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop files here' : 'Drag & drop photos and videos here'}
          </p>
          <p className="text-sm text-gray-500">or click to browse files</p>
          <p className="text-xs text-gray-400 mt-2">Maximum file size: 20MB</p>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">Selected Files</h3>
            <button
              onClick={handleUpload}
              disabled={uploading || !isAnyFileNotUploaded}
              className={`px-4 py-2 rounded-md ${
                uploading || !isAnyFileNotUploaded
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Upload All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="aspect-video bg-gray-100 relative">
                  {file.file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {!file.uploaded && !file.error && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X size={16} />
                    </button>
                  )}
                  
                  {file.uploaded && (
                    <div className="absolute top-2 right-2 p-1 bg-green-500 rounded-full text-white">
                      <Check size={16} />
                    </div>
                  )}
                  
                  {file.error && (
                    <div className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                      <X size={16} />
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-700 truncate" title={file.file.name}>
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {file.progress > 0 && file.progress < 100 && (
                    <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {file.error && (
                    <p className="mt-1 text-xs text-red-500">{file.error}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaUploader;