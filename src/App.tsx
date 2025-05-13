import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './utils/auth';
import { useAuthStore } from './store/authStore';

function App() {
  console.log('App component rendering (root route element)'); // Debug log

  const { initialize, initialized } = useAuthStore();
  
  useEffect(() => {
    console.log('App useEffect running, initialized:', initialized); // Debug log
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export default App;