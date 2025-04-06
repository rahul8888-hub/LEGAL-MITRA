"""
LegalMinds AI - Backend Server

This module provides the backend API endpoints for the LegalMinds AI application,
including the case outcome prediction feature.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import google.generativeai as genai # type: ignore
from dotenv import load_dotenv # type: ignore
import re
from typing import Dict, Any

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load API key from .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment variables")

# Configure the Gemini API with the API key if available
if api_key:
    genai.configure(api_key=api_key)

def analyze_case_outcome(case_details: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze case details to predict outcome probability and provide settlement recommendations.
    
    Args:
        case_details: Dictionary containing case information
            
    Returns:
        Dict containing analysis results
    """
    # Check if API key is available
    if not api_key:
        return {"error": "GEMINI_API_KEY not configured. Please set up your .env file."}
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    # Format case details for the prompt
    formatted_details = f"""
    Case Type: {case_details.get('case_type', 'Not specified')}
    Jurisdiction: {case_details.get('jurisdiction', 'Not specified')}
    
    Accuser/Plaintiff: {case_details.get('accuser', 'Not specified')}
    Accused/Defendant: {case_details.get('accused', 'Not specified')}
    Victim: {case_details.get('victim', 'Not specified')}
    
    Case Description:
    {case_details.get('case_description', 'Not provided')}
    
    Timeline:
    {case_details.get('timeline', 'Not provided')}
    
    Evidence:
    {case_details.get('evidence', 'Not provided')}
    
    Previous Legal History:
    {case_details.get('previous_legal_history', 'Not provided')}
    """
    
    prompt = f"""
    As a senior legal advisor specializing in Indian law, analyze the following case details and provide:
    1. A win probability percentage (0-100)
    2. A confidence score for your prediction (0-100)
    3. Key factors that influence your prediction
    4. Strengths in the case
    5. Weaknesses in the case
    6. Legal arguments in favor of both the plaintiff and defendant
    7. Applicable Indian laws with descriptions and links to Indian Kanoon
    8. If win probability is below 50%, provide a detailed settlement recommendation
    9. 2-3 similar cases with their outcomes and links to Indian Kanoon
    
    Return your analysis in JSON format with the following structure:
    {{
        "win_probability": <number>,
        "confidence_score": <number>,
        "key_factors": [<list of factors>],
        "strengths": [<list of strengths>],
        "weaknesses": [<list of weaknesses>],
        "legal_arguments": {{
            "plaintiff": [<list of arguments in favor of plaintiff>],
            "defendant": [<list of arguments in favor of defendant>]
        }},
        "applicable_laws": [
            {{
                "name": <string>,
                "description": <string>,
                "link": <string to Indian Kanoon>
            }}
        ],
        "settlement_recommendation": {{
            "recommended": <boolean>,
            "reason": <string>,
            "strategy": <string>,
            "potential_terms": [<list of potential settlement terms>]
        }},
        "similar_cases": [
            {{
                "case_name": <string>,
                "citation": <string>,
                "outcome": <string>,
                "relevance": <string>,
                "link": <string to Indian Kanoon>
            }}
        ]
    }}
    
    CASE DETAILS:
    {formatted_details}
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 2000,
                "temperature": 0.2
            }
        )
        
        # Handle the response correctly based on its structure
        if hasattr(response, 'text'):
            response_text = response.text
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            response_text = response.parts[0].text
        else:
            return {"error": "Unexpected response format from Gemini API"}
        
        # Extract JSON from the response
        try:
            # First attempt to extract JSON if wrapped in markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # If no markdown blocks, try direct parsing
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, return error
            return {"error": "Failed to parse response as JSON", "raw_response": response_text}
            
    except Exception as e:
        return {"error": str(e)}

# Mock function to simulate API if Gemini is not available
def mock_analyze_case_outcome() -> Dict[str, Any]:
    """Return mock data when Gemini API is not available"""
    return {
        "win_probability": 65,
        "confidence_score": 78,
        "key_factors": [
            "Strong documentary evidence",
            "Clear violation of contractual terms",
            "Precedents favor plaintiff"
        ],
        "strengths": [
            "Written contract with clear terms",
            "Evidence of breach is well-documented",
            "Damages are easily quantifiable"
        ],
        "weaknesses": [
            "Potential delay in raising the issue",
            "Some ambiguity in performance clauses",
            "Defendant has partial performance defense"
        ],
        "legal_arguments": {
            "plaintiff": [
                "Clear breach of Section 73 of Indian Contract Act",
                "Evidence shows intentional non-performance",
                "No force majeure conditions apply"
            ],
            "defendant": [
                "Substantial performance doctrine should apply",
                "Plaintiff failed to mitigate damages",
                "Terms were modified through subsequent conduct"
            ]
        },
        "applicable_laws": [
            {
                "name": "Indian Contract Act, 1872, Section 73",
                "description": "Compensation for loss or damage caused by breach of contract",
                "link": "https://indiankanoon.org/doc/1115037/"
            },
            {
                "name": "Specific Relief Act, 1963, Section 10",
                "description": "Cases in which specific performance of contract enforceable",
                "link": "https://indiankanoon.org/doc/999132/"
            }
        ],
        "settlement_recommendation": {
            "recommended": False,
            "reason": "Win probability is above 50%",
            "strategy": "",
            "potential_terms": []
        },
        "similar_cases": [
            {
                "case_name": "Carlill v. Carbolic Smoke Ball Co.",
                "citation": "1893 1 QB 256",
                "outcome": "Plaintiff won",
                "relevance": "Established that a unilateral offer can create a binding obligation once accepted by performance",
                "link": "https://indiankanoon.org/doc/171398/"
            },
            {
                "case_name": "Mohori Bibee v. Dharmodas Ghose",
                "citation": "(1903) 30 I.A. 114",
                "outcome": "Contract held void",
                "relevance": "Established that contracts with minors are void ab initio under Indian law",
                "link": "https://indiankanoon.org/doc/76016/"
            }
        ]
    }

# API endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "LegalMinds AI Backend"})

@app.route('/api/analyze-case', methods=['POST'])
def analyze_case():
    """Endpoint to analyze case details and predict outcomes"""
    try:
        case_details = request.json
        
        # Validate required data
        required_fields = ['case_description', 'accuser', 'accused']
        for field in required_fields:
            if not case_details.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # If API key is available, use Gemini; otherwise use mock data
        if api_key:
            result = analyze_case_outcome(case_details)
        else:
            result = mock_analyze_case_outcome()
            result["note"] = "Using mock data as GEMINI_API_KEY is not configured"
            
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5010))
    app.run(host='0.0.0.0', port=port, debug=True)