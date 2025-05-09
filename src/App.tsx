import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './utils/auth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import GalleryPage from './pages/GalleryPage';
import CollectionPage from './pages/CollectionPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuthStore } from './store/authStore';

function App() {
  console.log('App component rendering'); // Debug log

  const { initialize, initialized } = useAuthStore();
  
  useEffect(() => {
    console.log('App useEffect running, initialized:', initialized); // Debug log
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="upload" element={
            <RequireAuth>
              <UploadPage />
            </RequireAuth>
          } />
          <Route path="gallery" element={
            <RequireAuth>
              <GalleryPage />
            </RequireAuth>
          } />
          <Route path="collections/:id" element={
            <RequireAuth>
              <CollectionPage />
            </RequireAuth>
          } />
          <Route path="profile" element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          } />
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;