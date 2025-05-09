import { useNavigate } from 'react-router-dom';
import { Camera, Clock, Sparkles, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/auth';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero section */}
      <section className="text-center py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Photos Into
            <span className="text-indigo-600 block mt-2">Meaningful Stories</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI MomentCollage uses artificial intelligence to turn your photos and videos into beautiful memory collections with personalized stories and journal prompts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(isAuthenticated ? '/upload' : '/register')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-md"
            >
              {isAuthenticated ? 'Upload Media' : 'Get Started'}
            </button>
            <button
              onClick={() => navigate(isAuthenticated ? '/gallery' : '/login')}
              className="px-8 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
            >
              {isAuthenticated ? 'View Gallery' : 'Log In'}
            </button>
          </div>
        </motion.div>
      </section>
      
      {/* Features section */}
      <section className="py-16 bg-gray-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Camera className="h-8 w-8 text-indigo-600" />}
              title="Upload"
              description="Upload your photos and videos securely to your personal gallery"
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8 text-indigo-600" />}
              title="Organize"
              description="Your media is automatically organized by date and location for easy browsing"
            />
            <FeatureCard 
              icon={<Sparkles className="h-8 w-8 text-indigo-600" />}
              title="Generate"
              description="AI creates personalized stories and journal prompts from your memories"
            />
            <FeatureCard 
              icon={<Download className="h-8 w-8 text-indigo-600" />}
              title="Offline Access"
              description="Access your memories anytime, even without an internet connection"
            />
          </div>
        </div>
      </section>
      
      {/* Testimonial section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">What Our Users Say</h2>
          <blockquote className="relative">
            <div className="relative z-10">
              <p className="text-xl italic text-gray-700 mb-4">
                "AI MomentCollage transformed our family vacation photos into a beautiful narrative that captured the essence of our trip. The journal prompts helped me reflect on moments I might have forgotten otherwise."
              </p>
              <footer className="font-medium text-gray-900">
                — Sarah Johnson
              </footer>
            </div>
            <div className="absolute top-0 left-0 transform -translate-x-6 -translate-y-8 text-indigo-200 text-6xl z-0">
              "
            </div>
            <div className="absolute bottom-0 right-0 transform translate-x-6 translate-y-8 text-indigo-200 text-6xl z-0">
              "
            </div>
          </blockquote>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="bg-indigo-600 text-white py-16 rounded-lg my-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start Creating Your Memory Collection Today</h2>
          <p className="mb-8 text-indigo-100">Upload your first media and see the magic happen</p>
          <button
            onClick={() => navigate(isAuthenticated ? '/upload' : '/register')}
            className="px-8 py-3 bg-white text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors shadow-md"
          >
            {isAuthenticated ? 'Upload Media' : 'Get Started For Free'}
          </button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-lg shadow-sm"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

export default HomePage;