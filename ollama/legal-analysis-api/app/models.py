# models.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class CaseInput(BaseModel):
    case_type: str
    jurisdiction: str
    plaintiff: str
    defendant: str
    victim: Optional[str] = None
    description: str
    timeline: Optional[str] = None
    evidence: Optional[str] = None
    previous_legal_history: Optional[str] = None

class CaseReference(BaseModel):
    title: str
    link: str
    relevance: Optional[float] = None

class CaseAnalysis(BaseModel):
    win_probability: float
    favorable_points: List[str]
    unfavorable_points: List[str]
    references: List[CaseReference]
    legal_basis: str
    is_law_related: bool = True
    error_message: Optional[str] = None