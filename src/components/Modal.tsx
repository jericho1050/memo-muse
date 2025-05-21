import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    );
  };