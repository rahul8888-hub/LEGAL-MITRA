# mistral.py
import httpx
from typing import Dict, Any, List, Tuple

class MistralClient:
    def __init__(self):
        self.base_url = "http://localhost:11434/api"
        self.model = "mistral:latest"
    
    async def generate_response(self, prompt: str) -> str:
        """Generate a response from Mistral"""
        url = f"{self.base_url}/generate"
        
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data)
            response.raise_for_status()
            return response.json().get("response", "")
    
    async def is_law_related(self, case_description: str) -> bool:
        """Check if the case is related to law"""
        prompt = f"""
        Determine if the following case description is related to law or legal matters.
        Return only 'YES' if it is related to law, or 'NO' if it is not.
        
        Case description: {case_description}
        """
        
        response = await self.generate_response(prompt)
        return response.strip().upper() == "YES"
    
    async def analyze_case(self, case_data: Dict[str, Any], similar_cases: List[Dict[str, Any]]) -> Tuple[float, List[str], List[str], str]:
        """Analyze the case using similar cases from Indian Kanoon"""
        
        # Prepare context from similar cases
        case_contexts = []
        for i, case in enumerate(similar_cases[:3]):  # Use top 3 cases
            case_contexts.append(f"Case {i+1}: {case.get('title', 'Unknown')} - {case.get('snippet', 'No details available')}")
        
        case_context_str = "\n\n".join(case_contexts)
        
        # Prepare the prompt
        prompt = f"""
        Based on the following case details and similar cases, analyze the legal situation and provide:
        1. Win probability (as a percentage)
        2. Favorable points for the plaintiff
        3. Unfavorable points for the plaintiff
        4. Legal basis for your analysis
        
        Case details:
        Type: {case_data.get('case_type')}
        Jurisdiction: {case_data.get('jurisdiction')}
        Plaintiff: {case_data.get('plaintiff')}
        Defendant: {case_data.get('defendant')}
        Description: {case_data.get('description')}
        
        Similar cases from Indian Kanoon:
        {case_context_str}
        
        Format your response as follows:
        WIN_PROBABILITY: [percentage]
        
        FAVORABLE_POINTS:
        - [point 1]
        - [point 2]
        ...
        
        UNFAVORABLE_POINTS:
        - [point 1]
        - [point 2]
        ...
        
        LEGAL_BASIS:
        [detailed explanation]
        """
        
        response = await self.generate_response(prompt)
        
        # Parse response
        try:
            sections = response.split("\n\n")
            win_probability = float(sections[0].split(":")[1].strip().replace("%", "")) / 100
            
            favorable_points = []
            unfavorable_points = []
            legal_basis = ""
            
            for section in sections:
                if section.startswith("FAVORABLE_POINTS:"):
                    points = section.split("\n")[1:]
                    favorable_points = [p.strip("- ").strip() for p in points if p.strip()]
                elif section.startswith("UNFAVORABLE_POINTS:"):
                    points = section.split("\n")[1:]
                    unfavorable_points = [p.strip("- ").strip() for p in points if p.strip()]
                elif section.startswith("LEGAL_BASIS:"):
                    legal_basis = "\n".join(section.split("\n")[1:])
            
            return win_probability, favorable_points, unfavorable_points, legal_basis
            
        except (IndexError, ValueError):
            # Fallback if parsing fails
            return 0.5, ["Could not determine"], ["Could not determine"], "Analysis incomplete due to formatting issues"