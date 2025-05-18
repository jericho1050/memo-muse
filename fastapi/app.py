import re
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict
import httpx
import os
from dotenv import load_dotenv
from groq import AsyncGroq, APIError


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
class MediaItemInput(BaseModel):
    image_url: HttpUrl  # Supabase Storage URL for the image
    file_name: Optional[str] = (
        None  # Optional: if client wants to pass original filename for context
    )
    taken_at: Optional[str] = None
    location: Optional[str] = None


class GenerateSummaryRequest(BaseModel):
    media_items: List[MediaItemInput]


class GenerateSummaryResponse(BaseModel):
    summary: str
    prompts: List[str]


# Groq API integration
async def generate_collage_from_image_urls(media_items: List[MediaItemInput]) -> dict:
    """
    Calls the Groq multimodal API to generate a story and journal prompts from image URLs
    (e.g., from Supabase Storage) and their optional metadata.
    """
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ API key not configured")

    # Groq recommends a max of 5 images per request for Llama 4 Scout for best quality
    MAX_IMAGES_PER_REQUEST = 5
    if len(media_items) == 0:
        raise HTTPException(status_code=400, detail="No media items provided.")
    if len(media_items) > MAX_IMAGES_PER_REQUEST:
        raise HTTPException(
            status_code=413,
            detail=f"Too many media items. A maximum of {MAX_IMAGES_PER_REQUEST} items are allowed per request for optimal quality.",
        )

    # --- Prepare messages for Groq API ---
    system_prompt = (
        "You are an exceptionally creative and empathetic AI storyteller. "
        "Your task is to weave a rich, heartfelt narrative that connects a series of moments captured in photographs. "
        "Analyze the visual details of each image (provided as URLs) and incorporate any provided metadata (like filenames, timestamps, or locations) "
        "to understand the context and emotional significance. Your story should flow naturally, highlighting themes, "
        "emotions, and the personal journey these images represent. Conclude with two thoughtful journal prompts "
        "that encourage reflection on these memories."
    )

    user_content_parts = []
    user_prompt_introduction = (
        "Please analyze the following photographs (provided as URLs) and their associated metadata. "
        "Based on all these inputs, craft a cohesive and emotionally resonant story. "
        "After the story, provide two distinct journal prompts related to the collective memories and themes evoked.\n\n"
    )
    user_content_parts.append({"type": "text", "text": user_prompt_introduction})

    for i, item in enumerate(media_items):
        current_photo_details = f"Photo {i+1}:\n"
        if item.file_name:  # Use provided filename if available
            current_photo_details += f"- Filename: {item.file_name}\n"
        else:  # Fallback if filename not provided with URL
            try:
                # Attempt to derive a filename from URL for context, can be basic
                derived_filename = os.path.basename(item.image_url.path)
                current_photo_details += (
                    f"- Image Source: {derived_filename or 'N/A'}\n"
                )
            except Exception:
                current_photo_details += f"- Image Source: N/A\n"

        if item.taken_at:
            current_photo_details += f"- Taken At: {item.taken_at}\n"
        if item.location:
            current_photo_details += f"- Location: {item.location}\n"

        user_content_parts.append({"type": "text", "text": current_photo_details})
        user_content_parts.append(
            {
                "type": "image_url",
                "image_url": {"url": str(item.image_url)},  # Ensure URL is string
            }
        )
        user_content_parts.append({"type": "text", "text": "\n---\n"})  # Separator

    # --- Call Groq API ---
    try:
        client = AsyncGroq()
        completion = await client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content_parts},
            ],
            temperature=0.75,
            max_tokens=1500,
            top_p=1,
            stream=False,  # Vision models typically use stream=False
            stop=None,
        )

        if (
            not completion.choices
            or not completion.choices[0].message
            or not completion.choices[0].message.content
        ):
            raise HTTPException(
                status_code=500,
                detail="Groq API returned an empty or invalid response.",
            )

        ai_response_content = completion.choices[0].message.content
    
        # --- Parse the AI's response ---
        # Split the content to separate the main summary from the journal prompts section
        split_marker = re.compile(r"#*\s*Journal Prompts:?\s*#*", re.IGNORECASE)
        parts = split_marker.split(ai_response_content, 1)

        summary = parts[0].strip()
        prompts = []

        if len(parts) > 1 and parts[1].strip():
            prompts_text = parts[1].strip()
            potential_lines = prompts_text.split('\n')
            
            for line in potential_lines:
                line = line.strip()
                
                # 1. Remove numbering or simple bullets
                if re.match(r"^\d+\.\s*", line):
                    line = re.sub(r"^\d+\.\s*", "", line).strip()
                elif re.match(r"^[-*]\s*", line):
                    line = re.sub(r"^[-*]\s*", "", line).strip()
                
                # 2. Remove surrounding markdown (**, *)
                # Handle double asterisks (bold)
                if line.startswith("**") and line.endswith("**") and len(line) >= 4:
                    line = line[2:-2].strip()
                # Handle single asterisks (italic or bold if used singly)
                elif line.startswith("*") and line.endswith("*") and len(line) >= 2:
                    line = line[1:-1].strip()
                
                if line: # If anything meaningful is left
                    prompts.append(line)
        
        return {"summary": summary, "prompts": prompts[:2]}

    except APIError as e:
        error_detail = f"Groq API error: Status {e.status_code}, Response: {e.body if hasattr(e, 'body') else str(e)}"
        print(f"Detailed Groq API Error: {error_detail}")  # Server-side logging
        raise HTTPException(status_code=500, detail=error_detail)
    except Exception as e:
        print(
            f"General error in generate_collage_from_image_urls: {str(e)}"
        )  # Server-side logging
        raise HTTPException(
            status_code=500, detail=f"Error generating summary: {str(e)}"
        )


@app.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary_endpoint(request: GenerateSummaryRequest):
    """
    Generates a story summary and journal prompts based on a list of media items,
    each providing a URL to an image (e.g., from Supabase Storage) and optional metadata.
    """
    # The validation for number of items is now inside generate_collage_from_image_urls
    # Pydantic handles validation for the structure of GenerateSummaryRequest and MediaItemInput
    if (
        not request.media_items
    ):  # Should be caught by Pydantic if media_items is required and empty
        raise HTTPException(
            status_code=400, detail="No media items provided in the request."
        )

    result = await generate_collage_from_image_urls(request.media_items)
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
