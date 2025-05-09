import { ReactNode, createContext, useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('AuthProvider rendering'); // Debug log
  
  const { user, loading, initialized, initialize } = useAuthStore();
  
  useEffect(() => {
    console.log('AuthProvider useEffect, initialized:', initialized); // Debug log
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);
  
  const value = {
    isAuthenticated: !!user,
    isLoading: loading,
  };
  
  console.log('AuthProvider value:', value); // Debug log
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  console.log('useAuth hook called, context:', context); // Debug log
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  console.log('RequireAuth rendering'); // Debug log
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}