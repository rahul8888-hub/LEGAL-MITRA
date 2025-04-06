from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
from collections import deque
import threading
from typing import Dict, Any, List
import time

# Import from your modules
from pdf_processor import extract_text_from_pdf, chunk_text
from api_handler import (
    analyze_legal_text, 
    combine_legal_analyses, 
    is_legal_document,
    find_similar_cases
)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# User sessions storage - using thread lock for thread safety
user_sessions: Dict[str, Any] = {}
sessions_lock = threading.Lock()

# Maximum number of past queries to store per user
MAX_HISTORY = 5

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    """
    Endpoint to analyze a legal document (PDF or text)
    Expected input:
    - PDF file or text content
    - user_id (optional): to maintain session history
    - task_type: summary (default)
    """
    user_id = request.form.get('user_id', 'anonymous')
    task_type = request.form.get('task_type', 'summary')
    
    # Initialize session if needed
    init_user_session(user_id)
    
    try:
        text = None
        # Check if there's a file upload
        if 'file' in request.files:
            print("PDF file provided") # Added debug print
            file = request.files['file']
            if not file:
                return jsonify({"error": "No file provided"}), 400
                
            if not file.filename:
                return jsonify({"error": "No filename provided"}), 400
                
            if not file.filename.endswith('.pdf'):
                return jsonify({"error": "Only PDF files are supported"}), 400
                
            # Create a temporary file with a unique name
            temp_dir = tempfile.gettempdir()
            temp_path = os.path.join(temp_dir, f"legal_analysis_{user_id}_{int(time.time())}.pdf")
            
            try:
                # Save the uploaded PDF to the temp file
                file.save(temp_path)
                
                # Validate the PDF file
                if not os.path.exists(temp_path):
                    return jsonify({"error": "Failed to save PDF file"}), 500
                    
                # Extract text from the PDF
                text = extract_text_from_pdf(temp_path)
                if not text:
                    return jsonify({
                        "error": "Could not extract text from PDF. The file might be corrupted or scanned.",
                        "result": "Please ensure the PDF contains selectable text."
                    }), 400
                    
            finally:
                # Clean up - make sure this happens even if extraction fails
                try:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                except Exception as e:
                    logger.error(f"Warning: Failed to delete temporary file: {e}")
        else:
            # Get text directly from form
            text = request.form.get('text', '')
        
        if not text:
            return jsonify({"error": "No content provided"}), 400
        
        # Check if it's a legal document
        if not is_legal_document(text):
            return jsonify({
                "error": "The document doesn't appear to be a legal document.",
                "result": "Please upload a legal document for analysis."
            }), 400
        
        # Process document in chunks if it's large
        result = ""
        if len(text.split()) > 1500:
            chunks = chunk_text(text)
            chunk_results = []
            
            for i, chunk in enumerate(chunks):
                chunk_result = analyze_legal_text(chunk, task_type, is_chunk=True)
                chunk_results.append(chunk_result)
                
            # Combine results from all chunks
            result = combine_legal_analyses(chunk_results, task_type)
        else:
            # Process document in one go
            result = analyze_legal_text(text, task_type)
        
        # Store this query and result in user history
        store_user_interaction(user_id, {
            "type": "document_analysis",
            "task": task_type,
            "document_preview": text[:200] + "...",  # Store a preview
            "result": result
        })
        
        return jsonify({
            "result": result
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analyze_document: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/find-similar-cases', methods=['POST'])
def similar_cases_api():
    """
    Endpoint to find similar legal cases based on user query
    Expected input:
    - query: User's description of legal situation
    - user_id (optional): to maintain session history
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    query = data.get('query')
    user_id = data.get('user_id', 'anonymous')
    
    # Initialize session if needed
    init_user_session(user_id)
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    try:
        result = find_similar_cases(query)
        
        # Store this query and result in user history
        store_user_interaction(user_id, {
            "type": "similar_cases",
            "query": query,
            "result": result
        })
        
        return jsonify({
            "result": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ask-follow-up', methods=['POST'])
def ask_follow_up():
    """
    Endpoint for follow-up questions about previously analyzed documents
    Expected input:
    - query: User's follow-up question
    - user_id: to retrieve session history
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    query = data.get('query')
    user_id = data.get('user_id', 'anonymous')
    
    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    # Check if user has a history
    if user_id not in user_sessions:
        return jsonify({
            "error": "No previous analysis found. Please analyze a document first."
        }), 400
    
    try:
        # Get the history for context
        history = get_user_history(user_id)
        
        # Use Gemini to answer the follow-up question with context
        from api_handler import genai
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Build context from history
        context = "Previous document analyses and questions:\n\n"
        for entry in history:
            if entry["type"] == "document_analysis":
                context += f"Document Analysis ({entry['task']}):\n"
                context += f"Document preview: {entry['document_preview']}\n"
                context += f"Analysis result: {entry['result']}\n\n"
            elif entry["type"] == "similar_cases":
                context += f"Similar Cases Query: {entry['query']}\n"
                context += f"Similar Cases Result: {entry['result']}\n\n"
            elif entry["type"] == "follow_up":
                context += f"Previous Question: {entry['query']}\n"
                context += f"Previous Answer: {entry['result']}\n\n"
        
        prompt = f"""
        Based on the following context from previous analyses and the user's current question,
        provide a helpful response that addresses their specific follow-up question:
        
        CONTEXT:
        {context}
        
        CURRENT QUESTION:
        {query}
        
        Answer the question directly based on the context. If the question cannot be answered 
        based on the available context, explain why and suggest what information would be needed.
        Do not include any introductory or concluding remarks in your response.
        """
        
        response = model.generate_content(
            prompt,
            generation_config={
                "max_output_tokens": 2000,
                "temperature": 0.3
            }
        )
        
        # Get the response text
        if hasattr(response, 'text'):
            result = response.text
        elif hasattr(response, 'parts') and len(response.parts) > 0:
            result = response.parts[0].text
        else:
            result = "Error: Unable to generate a response"
            
        # Clean the output
        from api_handler import clean_gemini_output
        result = clean_gemini_output(result)
        
        # Store this query and result in user history
        store_user_interaction(user_id, {
            "type": "follow_up",
            "query": query,
            "result": result
        })
        
        return jsonify({
            "result": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user-history', methods=['GET'])
def get_history():
    """Get user's query history"""
    user_id = request.args.get('user_id', 'anonymous')
    
    if user_id not in user_sessions:
        return jsonify({"history": []}), 200
    
    history = get_user_history(user_id)
    return jsonify({"history": history}), 200

def init_user_session(user_id: str):
    """Initialize a user session if it doesn't exist"""
    with sessions_lock:
        if user_id not in user_sessions:
            user_sessions[user_id] = {
                "history": deque(maxlen=MAX_HISTORY)
            }

def store_user_interaction(user_id: str, interaction_data: Dict):
    """Store a user interaction in their history"""
    with sessions_lock:
        if user_id in user_sessions:
            user_sessions[user_id]["history"].append(interaction_data)

def get_user_history(user_id: str) -> List[Dict]:
    """Get a user's interaction history"""
    with sessions_lock:
        if user_id in user_sessions:
            return list(user_sessions[user_id]["history"])
        return []

if __name__ == '__main__':
    # Use environment variables for configuration in production
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)