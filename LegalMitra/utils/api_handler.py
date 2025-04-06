import google.generativeai as genai
import os
import json
import re
from typing import Literal, List, Dict, Any, Union
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure the Gemini API with the API key
genai.configure(api_key=api_key)

TaskType = Literal["summary"]

def get_gemini_response(prompt: str) -> str:
    """
    Get a response from the Gemini API.
    
    Args:
        prompt: The prompt to send to the Gemini API
        
    Returns:
        str: The response from the Gemini API
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    
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
            return response.text
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            return response.parts[0].text
        else:
            return "Error: Unexpected response format from Gemini API"
    except Exception as e:
        return f"Error: {str(e)}"

def is_legal_document(text: str) -> bool:
    """
    Check if the document appears to be an Indian legal document.
    
    Returns:
        bool: True if the document appears to be a legal document, False otherwise
    """
    # Create a set of keywords and patterns that indicate an Indian legal document
    legal_indicators = [
        r"versus|vs\.",  # Case parties
        r"appellant|respondent|petitioner",  # Legal parties
        r"section \d+|article \d+",  # Legal provisions
        r"court|tribunal|bench",  # Legal forums
        r"judgment|order|decree",  # Legal decisions
        r"hon'ble|lordship",  # Judicial references
        r"high court|supreme court|district court",  # Courts
        r"argued|submitted|contended",  # Legal argumentation
        r"constitution|ipc|crpc|cpc",  # Legal codes
        r"plaintiff|defendant|accused",  # Legal parties
        r"civil|criminal|writ",  # Case types
        r"appeal|petition|application"  # Legal filings
    ]
    
    # Check for the presence of these indicators
    pattern = '|'.join(legal_indicators)
    matches = re.findall(pattern, text.lower())
    
    # Set a threshold - at least 3 different legal indicators should be present
    unique_indicators = set(matches)
    return len(unique_indicators) >= 3

def is_legal_query_using_ai(query: str) -> bool:
    """
    Use Gemini AI to determine if a query is legal-related.
    
    Args:
        query: The user's query
        
    Returns:
        bool: True if the query is legal-related, False otherwise
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Determine if the following query is related to a legal situation, issue, or question in Indian law.
    Respond with ONLY "yes" or "no".
    
    Query: {query}
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 10,
                "temperature": 0.1
            }
        )
        
        # Handle the response correctly based on its structure
        if hasattr(response, 'text'):
            result = response.text.strip().lower()
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            result = response.parts[0].text.strip().lower()
        else:
            # Default to true in case of unexpected response format
            print("Unexpected response format from Gemini API")
            return True
            
        return result == "yes"
    except Exception as e:
        print(f"Error checking if query is legal: {str(e)}")
        # Default to true in case of error to avoid blocking legitimate queries
        return True

def clean_gemini_output(text: str) -> str:
    """
    Clean Gemini API output by removing generic AI framing language.
    
    Args:
        text: The raw text from Gemini API
        
    Returns:
        str: Cleaned text without AI framing language
    """
    # Remove common AI prefixes
    prefixes = [
        r"^(?:Here's|Below is) (?:the|an|a) analysis of the (?:provided|Indian) legal document(?:, presented from the perspective of a senior advocate|:|\.)?",
        r"^Based on the(?:se)? (?:provided|extracted) (?:Indian legal document|information)(?: that you shared)?, (?:here's|I have prepared) (?:a|the|an) (?:comprehensive |legal )?analysis(?:\:|\.)?",
        r"^(?:Here's|Below is) (?:a list of|the) relevant Indian precedents(?: mentioned| cited in the document| for this case)(?:\:|\.)?",
        r"^(?:Below are|Here are|Following are) the relevant Indian precedents(?: mentioned| cited| found| in this document)(?:\:|\.)?",
        r"^(?:Here is|This is|The following is) (?:a|my|the) (?:comprehensive |detailed |legal )?(?:analysis|assessment|summary|overview)(?: of the provided document| of the legal document| of the Indian legal document)(?:\:|\.)?",
        r"^I've analyzed this Indian legal document as requested(?:\:|\.)?",
        r"^As requested, (?:here's|I've created) (?:a|an|the) (?:analysis|summary)(?: of| for) this Indian legal document(?:\:|\.)?",
    ]
    
    for prefix in prefixes:
        text = re.sub(prefix, "", text, flags=re.IGNORECASE)
    
    # Remove common AI suffixes
    suffixes = [
        r"(?:This analysis is based on the information provided in the document\.|This analysis is based solely on the provided excerpt\.|Let me know if you need any clarification or have any questions about this analysis\.)$",
        r"(?:Please note that this analysis is based on the information provided and may not reflect all aspects of the case\.|This analysis is based on my understanding of Indian law\.)$",
        r"(?:I hope this helps\. Let me know if you need any clarification or additional information\.|I hope this analysis is helpful\. Let me know if you have any questions\.)$",
        r"(?:This analysis is meant to provide an overview of the key legal aspects of the document and is not a substitute for professional legal advice\.)$",
    ]
    
    for suffix in suffixes:
        text = re.sub(suffix, "", text, flags=re.IGNORECASE)
    
    # Trim whitespace and ensure proper formatting
    text = text.strip()
    
    return text

def analyze_legal_text(text: str, task: TaskType, is_chunk: bool = False) -> Union[Dict[str, Any], str]:
    """Analyze legal text using Gemini Pro"""
    
    # Different prompts based on whether processing a chunk or full document
    if is_chunk:
        prompts = {
            "summary": """
            Extract key information from this chunk of an Indian legal document:
            - Case names and parties
            - Legal provisions mentioned (e.g., Article numbers, Section numbers)
            - Key facts and arguments
            - Citations to other cases
            - Any decisions or conclusions
            
            Return the information in JSON format with these keys:
            {"case_names": [], "provisions": [], "facts_arguments": [], "citations": [], "decisions": []}
            
            Do not include any introductory or concluding remarks in your response.
            """
        }
    else:
        prompts = {
            "summary": """
            Analyze this Indian legal document as a senior advocate. Provide:
            1. Case name (if identifiable)
            2. Court and year
            3. Core legal issues (tag Articles like Art. 14, 19)
            4. Key arguments
            5. Final decision
            6. Important citations (format: (Year) Volume SCC Page)
            
            Do not include any introductory or concluding remarks in your response.
            """
        }

    model = genai.GenerativeModel('gemini-2.0-flash')
    try:
        response = model.generate_content(
            f"{prompts[task]}\n\nDOCUMENT:\n{text}",
            generation_config={
                "max_output_tokens": 2000,
                "temperature": 0.3
            }
        )
        
        # Handle the response correctly based on its structure
        if hasattr(response, 'text'):
            response_text = response.text
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            response_text = response.parts[0].text
        else:
            if is_chunk:
                return {"error": "Unexpected response format from Gemini API"}
            return "Error: Unexpected response format from Gemini API"
        
        # For chunks, try to parse as JSON for later consolidation
        if is_chunk:
            try:
                # First attempt to extract JSON if wrapped in markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group(1))
                
                # If no markdown blocks, try direct parsing
                return json.loads(response_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, return as plain text with a marker
                return {"parsing_failed": True, "text": response_text}
        
        # Clean the output before returning
        return clean_gemini_output(response_text)
    except Exception as e:
        if is_chunk:
            return {"error": str(e)}
        return f"API Error: {str(e)}"

def combine_legal_analyses(chunk_results: List[Dict[str, Any]], task: TaskType) -> str:
    """
    Intelligently combine analyses from multiple chunks into a coherent single analysis
    """
    if task == "summary":
        # Prepare consolidated data
        all_case_names = []
        all_provisions = []
        all_facts_arguments = []
        all_citations = []
        all_decisions = []
        
        # Gather data from all chunks
        for result in chunk_results:
            if isinstance(result, dict):
                # Handle parsing_failed case
                if result.get("parsing_failed"):
                    # Try to extract what we can using regex
                    text = result.get("text", "")
                    
                    # Extract case names with simple pattern
                    case_matches = re.findall(r'[vV]s\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', text)
                    if case_matches:
                        all_case_names.extend(case_matches)
                        
                    # Extract provisions
                    provision_matches = re.findall(r'(Article\s+\d+|Section\s+\d+[A-Z]?)', text)
                    if provision_matches:
                        all_provisions.extend(provision_matches)
                    
                    # Extract citations
                    citation_matches = re.findall(r'\(\d{4}\)\s+\d+\s+SCC\s+\d+', text)
                    if citation_matches:
                        all_citations.extend(citation_matches)
                    
                    continue
                
                # Normal JSON result
                all_case_names.extend(result.get("case_names", []))
                all_provisions.extend(result.get("provisions", []))
                all_facts_arguments.extend(result.get("facts_arguments", []))
                all_citations.extend(result.get("citations", []))
                all_decisions.extend(result.get("decisions", []))
        
        # Remove duplicates while preserving order
        def deduplicate(items):
            seen = set()
            return [x for x in items if not (x in seen or seen.add(x))]
        
        case_names = deduplicate(all_case_names)
        provisions = deduplicate(all_provisions)
        citations = deduplicate(all_citations)
        
        # For arguments and decisions, we need to keep all of them but try to consolidate
        consolidated_arguments = "\n\n".join(all_facts_arguments)
        consolidated_decisions = "\n\n".join(all_decisions)
        
        # Final consolidation - summarize with another Gemini call
        consolidated_data = f"""
        Case Names: {', '.join(case_names) if case_names else 'Not identified'}
        
        Legal Provisions: {', '.join(provisions) if provisions else 'Not identified'}
        
        Citations: {', '.join(citations) if citations else 'None found'}
        
        Key Arguments and Facts:
        {consolidated_arguments}
        
        Decisions/Conclusions:
        {consolidated_decisions}
        """
        
        # Make a final call to get a coherent summary
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(
            f"""
            IMPORTANT: Base your analysis ONLY on the provided case details, relevant laws, and similar cases i.e. from IndianKanoon API only no making cases by yourself. Do not make assumptions or include information not provided in these sources. Provide proofs that these are real world cases.
            
            Based on the following extracted information from an Indian legal document, 
            create a coherent and comprehensive legal analysis as a senior advocate would:
            
            {consolidated_data}
            
            Format your response as:
            1. Case name (if identifiable)
            2. Court and year
            3. Core legal issues (tag Articles like Art. 14, 19)
            4. Key arguments
            5. Final decision
            6. Important citations (format: (Year) Volume SCC Page)
            
            Do not include any introductory or concluding remarks in your response.
            But like the format provided above the result it should have these bullet points and after the bullet points the result generated
            """,
            generation_config={"max_output_tokens": 2000, "temperature": 0.2}
        )
        
        # Clean the final output
        return clean_gemini_output(response.text)

    # Default fallback for unknown task
    return "Analysis could not be completed. Please try again."

def find_similar_cases(user_query: str) -> str:
    """
    Find similar cases based on user's legal situation description using Gemini AI.
    
    Args:
        user_query: User's description of their legal situation
        
    Returns:
        str: Formatted response with similar cases and analysis
    """
    # First check if the query is legal-related using AI
    if not is_legal_query_using_ai(user_query):
        return "Your query does not appear to be related to a legal situation. Please provide more details about a legal issue, case, or situation you'd like to research."
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    As a legal research assistant specializing in Indian law, analyze this legal situation and find similar Indian court cases:
    
    {user_query}
    
    Please provide:
    1. A brief analysis of the key legal issues in this situation
    2. 3-5 relevant Indian court cases (Supreme Court or High Courts) that are similar to this situation
    3. For each case, include:
       - Case name and citation (e.g., (Year) Volume SCC Page)
       - Court and year
       - Brief summary of facts
       - How the court ruled
       - Why this case is relevant to the user's situation
    4. A brief conclusion on how these precedents might apply to the user's situation
    5. Any additional legal considerations the user should be aware of
    
    Format your response in a clear, structured way with headings and bullet points where appropriate.
    Do not include any introductory or concluding remarks in your response.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 2000,
                "temperature": 0.3
            }
        )
        
        # Handle the response correctly based on its structure
        if hasattr(response, 'text'):
            response_text = response.text
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            response_text = response.parts[0].text
        else:
            return "Error: Unexpected response format from Gemini API"
        
        # Clean the output before returning
        cleaned_text = clean_gemini_output(response_text)
        
        # Extract case names and citations to add IndianKanoon links
        case_pattern = r'([A-Za-z\s]+v\.\s+[A-Za-z\s]+)'
        citation_pattern = r'\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)'
        
        # Find all case names and citations
        case_matches = re.findall(case_pattern, cleaned_text)
        citation_matches = re.findall(citation_pattern, cleaned_text)
        
        # Create a mapping of case names to citations
        case_citation_map = {}
        for i, case in enumerate(case_matches):
            if i < len(citation_matches):
                case_citation_map[case.strip()] = citation_matches[i]
        
        # Add IndianKanoon links to the text
        for case_name, citation in case_citation_map.items():
            year, volume, page = citation
            indiankanoon_link = f"https://indiankanoon.org/doc/{page}/"
            
            # Create a markdown link
            link_text = f"[View full case on IndianKanoon]({indiankanoon_link})"
            
            # Add the link after the case name and citation
            case_pattern_with_citation = f"{case_name}.*?\\(\\d{{4}}\\)\\s+\\d+\\s+SCC\\s+\\d+"
            replacement = f"{case_name} ({year}) {volume} SCC {page} {link_text}"
            
            cleaned_text = re.sub(case_pattern_with_citation, replacement, cleaned_text, flags=re.IGNORECASE)
        
        return cleaned_text
    except Exception as e:
        return f"Error finding similar cases: {str(e)}"