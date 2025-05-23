# AI MomentCollage

Transform your photos and videos into meaningful memory collections with AI-generated stories and journal prompts.

## Features

- **Media Management**: Upload, organize, and view your photos and videos
- **Automatic Organization**: Extracts EXIF data to organize by date and location
- **AI Story Generation**: Creates personalized narratives from your media using Groq's Llama 4 Scout
- **Journal Prompts**: AI-generated reflection questions to deepen your connection to memories
- **PWA Support**: Works offline and can be installed on your home screen
- **Responsive Design**: Optimized for all devices from mobile to desktop

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python) with Mangum for serverless deployment
- **Storage**: Supabase (Auth, Storage, and PostgreSQL)
- **PWA**: Service workers with vite-plugin-pwa
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Deployment**: Vercel (full-stack deployment)

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- Python 3.8+ (for local development)
- Supabase account
- Groq API key

### Frontend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-momentcollage.git
   cd ai-momentcollage
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file with your credentials
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Backend Setup (Local Development)

1. Create a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server locally
   ```bash
   uvicorn api.index:app --reload
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/migrations/` to set up your database schema
3. Enable Storage and create a bucket called `media`
4. Set up appropriate bucket policies for authenticated users

## Deployment

### Deploying to Vercel

1. Install Vercel CLI (optional)
   ```bash
   npm install -g vercel
   ```

2. Deploy using Vercel CLI
   ```bash
   vercel
   ```

   Or connect your GitHub repository to Vercel for automatic deployments.

3. Set up environment variables in Vercel dashboard:
   - `GROQ_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

The API endpoints will be available at:
- `https://your-vercel-domain.vercel.app/api/generate-summary`
- `https://your-vercel-domain.vercel.app/api/health`

## Building for Production

### Frontend

```bash
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
