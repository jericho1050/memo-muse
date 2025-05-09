from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure app
app = FastAPI(title="AI MomentCollage API")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class MediaItem(BaseModel):
    file_name: str
    taken_at: Optional[str] = None
    location: Optional[str] = None

class GenerateSummaryRequest(BaseModel):
    media_items: List[MediaItem]

class GenerateSummaryResponse(BaseModel):
    summary: str
    prompts: List[str]

# OpenAI API integration
async def generate_summary_with_gpt4(media_items: List[MediaItem]) -> dict:
    """
    Call OpenAI API to generate a summary and journal prompts
    """
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    # Prepare the message content
    content = "Generate a story and journal prompts based on these photos:\n\n"
    
    for i, item in enumerate(media_items, 1):
        content += f"{i}. {item.file_name}"
        if item.taken_at:
            content += f" (taken on {item.taken_at})"
        if item.location:
            content += f" at {item.location}"
        content += "\n"
    
    content += "\nCreate a heartfelt story that connects these moments, highlighting emotions and personal significance. Also provide 2 thoughtful journaling prompts related to these memories."
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "You are a thoughtful AI that creates meaningful narratives from photo metadata. Your stories are personal, warm, and emotionally resonant."},
                        {"role": "user", "content": content}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 800
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error calling OpenAI API")
            
            data = response.json()
            ai_response = data["choices"][0]["message"]["content"]
            
            # Parse the response to extract summary and prompts
            # This is a simple implementation; in production, you might want more robust parsing
            parts = ai_response.split("Journal Prompts:")
            
            summary = parts[0].strip()
            prompts_text = parts[1].strip() if len(parts) > 1 else ""
            
            # Extract prompts as a list
            prompts = []
            for line in prompts_text.split("\n"):
                line = line.strip()
                if line and (line.startswith("1.") or line.startswith("2.") or line.startswith("-")):
                    prompts.append(line.lstrip("12.- ").strip())
            
            return {
                "summary": summary,
                "prompts": prompts[:2]  # Take up to 2 prompts
            }
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to OpenAI API timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest):
    """
    Generate a story summary and journal prompts based on media items
    """
    if not request.media_items:
        raise HTTPException(status_code=400, detail="No media items provided")
    
    result = await generate_summary_with_gpt4(request.media_items)
    return result

@app.get("/health")
async def health_check():
    """
    Simple health check endpoint
    """
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)