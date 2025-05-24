# AI MomentCollage

Transform your photos into meaningful memory collections with AI-generated stories and journal prompts.

## Features

- **Media Management**: Upload, organize, and view your photos and videos
- **Image Collage Tool**: Create your own custom collage with our easy to use tool
- **AI Story Generation**: Creates personalized narratives from your media using Groq's Llama 4 Scout
- **Journal Prompts**: AI-generated reflection questions to deepen your connection to memories
- **Responsive Design**: Optimized for all devices from mobile to desktop

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python) 
- **Storage**: Supabase ( Storage, and PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Deployment**: Vercel (full-stack deployment)

## Demo

https://github.com/user-attachments/assets/9a1be661-396d-4ca6-aaca-6922bcf73015

https://github.com/user-attachments/assets/eef0d2f3-703e-4991-ba00-4af3704cabc5

https://github.com/user-attachments/assets/d3bac506-5c73-4858-9e3a-056ceb7613ad

https://github.com/user-attachments/assets/537dc087-1aa8-49b8-a8a3-dbd7f311d644

https://github.com/user-attachments/assets/d3b15fbf-aa85-405a-a31e-01269ba252b4

https://github.com/user-attachments/assets/64e96846-f01c-44b0-bc75-bd5d32e2dd2e


## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- Python 3.11 or 3.12 (for local development)
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
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_FASTAPI_URL=http://localhost:8000/api
   FRONTEND_URL=http://localhost:5173
   GROQ_API_KEY=
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
   - `FRONTEND_URL`
   - `VITE_FASTAPI_URL`

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
