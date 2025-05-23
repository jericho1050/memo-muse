import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App'; // App will now be the root layout/component
import './index.css';
import { registerSW } from './utils/registerSW';
import { AuthProvider, RequireAuth } from './utils/auth'; // Import RequireAuth
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage, { loginAction } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import GalleryPage from './pages/GalleryPage';
import CollagePage from './pages/CollagePage';
import CollectionPage from './pages/CollectionPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Debug logging
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Register service worker
registerSW();

const router = createBrowserRouter([
  {
    element: <App />, // App component wraps AuthProvider and initialization
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { 
            path: 'login', 
            element: <LoginPage />,
            action: loginAction
          },
          { path: 'register', element: <RegisterPage /> },
          {
            path: 'upload',
            element: (
              <RequireAuth>
                <UploadPage />
              </RequireAuth>
            ),
          },
          {
            path: 'gallery',
            element: (
              <RequireAuth>
                <GalleryPage />
              </RequireAuth>
            ),
          },
          {
            path: 'collage',
            element: (
              <RequireAuth>
                <CollagePage />
              </RequireAuth>
            ),
          },
          {
            path: 'collections/:id',
            element: (
              <RequireAuth>
                <CollectionPage />
              </RequireAuth>
            ),
          },
          {
            path: 'profile',
            element: (
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

const root = createRoot(rootElement);
console.log('Root created');

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
console.log('Render called');