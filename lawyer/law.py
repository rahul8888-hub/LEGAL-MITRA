from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import google.generativeai as genai
import os

app = Flask(__name__)
# Configure CORS to allow requests from your frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:5174"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure Gemini API with direct API key
GEMINI_API_KEY = "AIzaSyALnzp0xckYZcuR_O5Z8TLrGSGnN1bANPo"  # Replace with your actual API key
genai.configure(api_key=GEMINI_API_KEY)

# Dictionary of legal case types and their relevant specializations
LEGAL_SPECIALIZATIONS = {
    "criminal": ["Criminal", "Constitutional"],
    "theft": ["Criminal"],
    "robbery": ["Criminal"],
    "murder": ["Criminal"],
    "assault": ["Criminal"],
    "battery": ["Criminal"],
    "fraud": ["Criminal", "Financial"],
    "traffic": ["Criminal", "Traffic"],
    "accident": ["Criminal", "Personal Injury"],
    "hit and run": ["Criminal", "Personal Injury"],
    "property": ["Civil", "Property", "Real Estate"],
    "land": ["Civil", "Property", "Real Estate"],
    "real estate": ["Civil", "Property", "Real Estate"],
    "boundary": ["Civil", "Property"],
    "eviction": ["Civil", "Property", "Tenancy"],
    "landlord": ["Civil", "Property", "Tenancy"],
    "tenant": ["Civil", "Property", "Tenancy"],
    "divorce": ["Family", "Matrimonial"],
    "custody": ["Family", "Matrimonial"],
    "alimony": ["Family", "Matrimonial"],
    "child support": ["Family", "Matrimonial"],
    "domestic violence": ["Family", "Criminal"],
    "marriage": ["Family", "Matrimonial"],
    "corporate": ["Corporate", "Business"],
    "business": ["Corporate", "Business"],
    "trademark": ["Intellectual Property"],
    "patent": ["Intellectual Property"],
    "copyright": ["Intellectual Property"],
    "employment": ["Labor", "Employment"],
    "wrongful termination": ["Labor", "Employment"],
    "discrimination": ["Labor", "Employment", "Constitutional"],
    "harassment": ["Labor", "Employment", "Criminal"],
    "tax": ["Tax", "Financial"],
    "bankruptcy": ["Bankruptcy", "Financial"],
    "debt": ["Financial", "Civil"],
    "immigration": ["Immigration"],
    "visa": ["Immigration"],
    "citizenship": ["Immigration", "Constitutional"],
    "medical malpractice": ["Medical", "Personal Injury"],
    "negligence": ["Civil", "Personal Injury"],
    "injury": ["Personal Injury"],
    "compensation": ["Personal Injury", "Labor"],
    "environment": ["Environmental"],
    "pollution": ["Environmental"],
    "consumer": ["Consumer", "Civil"],
    "product liability": ["Consumer", "Personal Injury"],
    "defamation": ["Civil", "Constitutional"],
    "libel": ["Civil", "Constitutional"],
    "slander": ["Civil", "Constitutional"],
    "contract": ["Civil", "Contract"],
    "agreement": ["Civil", "Contract"],
    "constitution": ["Constitutional"],
    "rights": ["Constitutional", "Civil"],
    "fundamental rights": ["Constitutional"],
    "privacy": ["Constitutional", "Civil"],
    "ancestral": ["Property", "Family", "Civil"],
    "inheritance": ["Property", "Family", "Civil"],
    "will": ["Property", "Family", "Civil"]
}

# Determine appropriate court levels for different case types
COURT_LEVELS = {
    "minor": "District Court",
    "local": "District Court",
    "district": "District Court",
    "state": "High Court",
    "high": "High Court",
    "supreme": "Supreme Court",
    "constitutional": "Supreme Court",
    "federal": "Supreme Court"
}

# Load lawyers data
def load_lawyers_data():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading lawyers data: {str(e)}")
        return []

# Analyze the case description to identify key terms and concepts
def identify_case_details(case_description):
    try:
        prompt = f"""
        Analyze this legal case description and identify ONLY these key elements:
        1. The main legal issue (e.g., murder, divorce, property dispute)
        2. Type of law involved (e.g., criminal, family, property)
        3. Appropriate court level (district, high, supreme)
        
        Case description: "{case_description}"
        
        Return ONLY a JSON object in this format:
        {{
          "main_issue": "single main issue",
          "law_types": ["primary law type", "secondary law type"],
          "court_level": "appropriate court level"
        }}
        """
        
        model = genai.GenerativeModel('gemini-1.0-pro-latest')
        response = model.generate_content(prompt)
        text = response.text
        
        # Extract JSON if present
        if '{' in text and '}' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            result = json.loads(text[start:end])
            return result
    except Exception as e:
        print(f"Error in identify_case_details: {str(e)}")
    
    # If API call fails or returns invalid data, fall back to keyword matching
    return extract_case_details_from_text(case_description)

# Backup method: Extract case details using keyword matching
def extract_case_details_from_text(text):
    text = text.lower()
    
    # Initialize variables
    main_issue = "general"
    law_types = []
    court_level = "District Court"  # Default court level
    
    # Find matching specializations
    matching_specializations = set()
    for keyword, specializations in LEGAL_SPECIALIZATIONS.items():
        if keyword in text:
            main_issue = keyword
            for spec in specializations:
                matching_specializations.add(spec)
    
    # Determine court level
    for keyword, level in COURT_LEVELS.items():
        if keyword in text:
            court_level = level
            break
            
    # If no matches found, use generic civil case
    if not matching_specializations:
        matching_specializations = {"Civil"}
    
    return {
        "main_issue": main_issue,
        "law_types": list(matching_specializations)[:3],  # Take only top 3
        "court_level": court_level
    }

# Score each lawyer based on how well they match the case requirements
def score_lawyers(lawyers, case_details):
    scored_lawyers = []
    
    for lawyer in lawyers:
        score = 0
        
        # Check specialization match with law types
        for i, law_type in enumerate(case_details["law_types"]):
            weight = 50 / (i + 1)  # Give more weight to primary law type
            if any(spec in law_type for spec in lawyer["specialization"]):
                score += weight
        
        # Check court level match
        if lawyer["court"] == case_details["court_level"]:
            score += 30
        elif (lawyer["court"] == "High Court" and case_details["court_level"] == "District Court") or \
             (lawyer["court"] == "Supreme Court" and case_details["court_level"] in ["District Court", "High Court"]):
            # Higher court lawyers can handle lower court cases
            score += 20
        
        # Add value for money (inversely proportional to fees, up to 20 points)
        max_fee = 100000  # Assuming this is a reasonable upper limit
        fee_score = 20 * (1 - min(lawyer["avg_fees"], max_fee) / max_fee)
        score += fee_score
        
        # Total possible score: 50 + 30 + 20 = 100
        scored_lawyers.append({
            "lawyer": lawyer,
            "score": score
        })
    
    # Sort by score descending
    return sorted(scored_lawyers, key=lambda x: x["score"], reverse=True)

# Find the best lawyers for a case
def find_best_lawyers(case_description, all_lawyers):
    try:
        # Get case details
        case_details = identify_case_details(case_description)
        
        # Score and sort lawyers
        scored_lawyers = score_lawyers(all_lawyers, case_details)
        
        # Return top 5 lawyers
        top_lawyers = []
        for item in scored_lawyers[:5]:
            lawyer = item["lawyer"]
            top_lawyers.append({
                "name": lawyer["name"],
                "specialization": lawyer["specialization"],
                "court": lawyer["court"],
                "avg_fees": lawyer["avg_fees"],
                "consultation_fees": lawyer["consultation_fees"]
            })
        
        return top_lawyers
    except Exception as e:
        print(f"Error in find_best_lawyers: {str(e)}")
        # If all else fails, return top 5 lawyers by avg_fees (as a proxy for quality)
        sorted_lawyers = sorted(all_lawyers, key=lambda x: x["avg_fees"], reverse=True)
        return [{
            "name": lawyer["name"],
            "specialization": lawyer["specialization"],
            "court": lawyer["court"],
            "avg_fees": lawyer["avg_fees"],
            "consultation_fees": lawyer["consultation_fees"]
        } for lawyer in sorted_lawyers[:5]]

@app.route('/api/recommend', methods=['POST'])
def recommend_lawyers():
    try:
        data = request.get_json()
        if not data or 'caseDescription' not in data:
            return jsonify({'error': 'Missing case description'}), 400

        case_description = data['caseDescription']
        all_lawyers = load_lawyers_data()
        
        if not all_lawyers:
            return jsonify({'error': 'Failed to load lawyers data'}), 500

        # Identify case details
        case_details = identify_case_details(case_description)
        
        # Get recommendations
        recommendations = find_best_lawyers(case_description, all_lawyers)
        
        # Generate case analysis
        case_analysis = {
            'case_type': case_details['main_issue'].capitalize(),
            'specializations': case_details['law_types'],
            'court_level': case_details['court_level']
        }

        return jsonify({
            'recommendations': recommendations,
            'case_analysis': case_analysis
        })

    except Exception as e:
        print(f"Error in recommend_lawyers: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5020)