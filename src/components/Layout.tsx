import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import { useAuth } from '../utils/auth';
import { motion } from 'framer-motion';

function Layout() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MomentCollage...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar isAuthenticated={isAuthenticated} />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200">
        <p>© {new Date().getFullYear()} AI MomentCollage. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;