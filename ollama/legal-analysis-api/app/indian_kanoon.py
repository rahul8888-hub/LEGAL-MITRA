# indian_kanoon.py
import requests
import os
from typing import List, Dict, Any, Optional

class IndianKanoonClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.indiankanoon.org/search/"
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def search_cases(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for cases on Indian Kanoon based on query"""
        try:
            params = {
                "query": query,
                "max_results": max_results
            }
            response = requests.get(self.base_url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json().get("docs", [])
        except requests.RequestException as e:
            print(f"Error searching Indian Kanoon: {str(e)}")
            return []
    
    def get_case_details(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a specific case"""
        try:
            url = f"{self.base_url}{doc_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error getting case details: {str(e)}")
            return None