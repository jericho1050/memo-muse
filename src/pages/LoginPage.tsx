import { useState } from 'react';
import { Link, useNavigate, useLocation, Form, useActionData, ActionFunctionArgs } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

interface ActionData {
  error?: string;
  success?: boolean;
}

// Action function that will be exported and used in route configuration
export async function loginAction({ request }: ActionFunctionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  // Basic validation
  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }
  
  try {
    // Access the auth store directly since we're outside the component
    const { signIn } = useAuthStore.getState();
    await signIn(email, password);
    return { success: true };
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error?.status && error.status >= 400) {
      return { error: error.message || 'Invalid email or password' };
    } else {
      return { error: error.message || 'Failed to sign in' };
    }
  }
}

function LoginPage() {
  const actionData = useActionData() as ActionData;
  const { loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/gallery';
  
  // If login was successful, redirect to the intended page
  if (actionData?.success) {
    navigate(from, { replace: true });
  }

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-lg shadow-sm"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to access your memories</p>
        </div>
        
        {actionData?.error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-6">
            {actionData.error}
          </div>
        )}
        
        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </Form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
