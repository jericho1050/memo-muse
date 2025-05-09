# AI MomentCollage

Transform your photos and videos into meaningful memory collections with AI-generated stories and journal prompts.

## Features

- **Media Management**: Upload, organize, and view your photos and videos
- **Automatic Organization**: Extracts EXIF data to organize by date and location
- **AI Story Generation**: Creates personalized narratives from your media using GPT-4
- **Journal Prompts**: AI-generated reflection questions to deepen your connection to memories
- **PWA Support**: Works offline and can be installed on your home screen
- **Responsive Design**: Optimized for all devices from mobile to desktop

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python)
- **Storage**: Supabase (Auth, Storage, and PostgreSQL)
- **PWA**: Service workers with vite-plugin-pwa
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Deployment**: Netlify (frontend), Render/Heroku/etc. (backend)

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- Python 3.8+ (for the FastAPI backend)
- Supabase account
- OpenAI API key

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

3. Create a `.env` file with your Supabase credentials
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the FastAPI backend directory
   ```bash
   cd fastapi
   ```

2. Create a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your OpenAI API key
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Start the FastAPI server
   ```bash
   uvicorn app:app --reload
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/migrations/` to set up your database schema
3. Enable Storage and create a bucket called `media`
4. Set up appropriate bucket policies for authenticated users

## Building for Production

### Frontend

```bash
npm run build
```

### Backend

Deploy the FastAPI app to your preferred hosting service (Render, Heroku, etc.)

## Deploying to Netlify

1. Connect your repository to Netlify
2. Set build command to `npm run build`
3. Set publish directory to `dist`
4. Add environment variables for Supabase

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Demo Video Script

**Introduction (0:00 - 0:10)**
"Welcome to AI MomentCollage, an app that transforms your photos into meaningful stories using artificial intelligence."

**Authentication (0:10 - 0:20)**
"Start by creating an account or signing in to your existing account."

**Uploading Media (0:20 - 0:40)**
"Upload your photos and videos easily by dragging and dropping them or browsing your files. The app automatically extracts metadata like date and location."

**Gallery View (0:40 - 1:00)**
"Browse your media in the gallery view, which can be toggled between grid and timeline views. The timeline organizes your photos by date."

**Creating Collections (1:00 - 1:20)**
"Select multiple photos to create a collection. Give it a name that represents the memory or event."

**AI Story Generation (1:20 - 1:50)**
"The app generates a personalized story that connects your photos, highlighting emotions and significance. It also creates journal prompts to help you reflect on these memories."

**Offline Capabilities (1:50 - 2:10)**
"As a Progressive Web App, AI MomentCollage works offline. Add it to your home screen for a native-like experience."

**Conclusion (2:10 - 2:20)**
"AI MomentCollage: Transforming moments into meaningful memories."