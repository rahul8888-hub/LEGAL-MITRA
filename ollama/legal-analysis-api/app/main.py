# main.py
import os
from fastapi import FastAPI, HTTPException, Depends
from dotenv import load_dotenv
from .models import CaseInput, CaseAnalysis, CaseReference
from .indian_kanoon import IndianKanoonClient
from .mistral import MistralClient

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("static/index.html")

# Load environment variables
load_dotenv()
INDIAN_KANOON_API_KEY = os.getenv("INDIAN_KANOON_API_KEY")

app = FastAPI(title="Legal Case Analysis API")
mistral_client = MistralClient()

def get_kanoon_client():
    return IndianKanoonClient(api_key=INDIAN_KANOON_API_KEY)

@app.post("/analyze-case", response_model=CaseAnalysis)
async def analyze_case(case_input: CaseInput, kanoon_client: IndianKanoonClient = Depends(get_kanoon_client)):
    """Analyze a legal case using Mistral and Indian Kanoon"""
    
    # Check if the case is law-related
    is_law_related = await mistral_client.is_law_related(case_input.description)
    if not is_law_related:
        return CaseAnalysis(
            win_probability=0.0,
            favorable_points=[],
            unfavorable_points=[],
            references=[],
            legal_basis="",
            is_law_related=False,
            error_message="The provided case does not appear to be related to law or legal matters."
        )
    
    # Construct search query
    search_query = f"{case_input.case_type} {case_input.plaintiff} {case_input.defendant} {case_input.description[:100]}"
    
    # Search for similar cases
    similar_cases = kanoon_client.search_cases(search_query)
    
    if not similar_cases:
        return CaseAnalysis(
            win_probability=0.0,
            favorable_points=[],
            unfavorable_points=[],
            references=[],
            legal_basis="No similar cases found in the Indian Kanoon database.",
            is_law_related=True,
            error_message="Unable to find similar cases to analyze. Please provide more specific legal details."
        )
    
    # Analyze the case using Mistral
    win_probability, favorable_points, unfavorable_points, legal_basis = await mistral_client.analyze_case(
        case_input.dict(),
        similar_cases
    )
    
    # Create references
    references = []
    for case in similar_cases:
        references.append(
            CaseReference(
                title=case.get("title", "Untitled Case"),
                link=f"https://indiankanoon.org/doc/{case.get('doc_id', '')}/",
                relevance=case.get("score", 0.0)
            )
        )
    
    return CaseAnalysis(
        win_probability=win_probability,
        favorable_points=favorable_points,
        unfavorable_points=unfavorable_points,
        references=references,
        legal_basis=legal_basis,
        is_law_related=True
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)