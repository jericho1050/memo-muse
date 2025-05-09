import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Images, Upload, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

interface NavBarProps {
  isAuthenticated: boolean;
}

function NavBar({ isAuthenticated }: NavBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    closeMenu();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Images className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">MomentCollage</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/gallery" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Gallery
                </Link>
                <Link to="/upload" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Upload
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Profile
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-indigo-600 transition-colors">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="container mx-auto px-4 py-2 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/gallery"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMenu}
                  >
                    <Images size={18} className="mr-2" />
                    Gallery
                  </Link>
                  <Link
                    to="/upload"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMenu}
                  >
                    <Upload size={18} className="mr-2" />
                    Upload
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMenu}
                  >
                    <User size={18} className="mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default NavBar;