import fitz  # PyMuPDF
import re
from typing import Optional, List
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """
    Extract text from PDF with improved error handling, validation, and cleanup
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as string or None if extraction fails
    """
    try:
        # Validate PDF file
        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found: {pdf_path}")
            return None
            
        # Open PDF document
        with fitz.open(pdf_path) as doc:
            # Check if document is valid and not empty
            if doc.page_count == 0:
                logger.error("PDF document is empty")
                return None
                
            text_blocks = []
            for page_num, page in enumerate(doc):
                try:
                    # Extract text with layout preservation
                    page_text = page.get_text("text")
                    
                    # Basic validation of extracted text
                    if not page_text.strip():
                        logger.warning(f"No text extracted from page {page_num + 1}")
                        continue
                        
                    # Clean up common OCR/PDF extraction issues
                    page_text = re.sub(r'\s+', ' ', page_text)  # Remove excessive whitespace
                    page_text = re.sub(r'(\w)-\s+(\w)', r'\1\2', page_text)  # Fix hyphenated words
                    page_text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', page_text)  # Remove control characters
                    
                    text_blocks.append(page_text)
                except Exception as page_error:
                    logger.error(f"Error processing page {page_num + 1}: {str(page_error)}")
                    continue
            
            if not text_blocks:
                logger.error("No text could be extracted from the PDF")
                return None
                
            # Combine all text blocks
            full_text = "\n".join(text_blocks)
            
            # Final validation
            if len(full_text.strip()) < 10:  # Arbitrary minimum length
                logger.error("Extracted text is too short to be valid")
                return None
                
            return full_text
            
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}")
        return None

def chunk_text(text: str, max_words: int = 1500, overlap: int = 200) -> List[str]:
    """
    Split text into word-based chunks with overlap to maintain context
    
    Args:
        text: The text to split
        max_words: Maximum words per chunk
        overlap: Number of words to overlap between chunks
    
    Returns:
        List of text chunks
    """
    if not text or not isinstance(text, str):
        logger.error("Invalid text input for chunking")
        return []
        
    words = text.split()
    
    if len(words) <= max_words:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(words):
        end = min(start + max_words, len(words))
        chunk = ' '.join(words[start:end])
        chunks.append(chunk)
        
        # Move start pointer with overlap
        start += max_words - overlap
        if start >= len(words):
            break
    
    return chunks