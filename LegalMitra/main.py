import os
import streamlit as st
from utils.pdf_processor import extract_text_from_pdf, chunk_text
from utils.api_handler import analyze_legal_text, combine_legal_analyses, is_legal_document, find_similar_cases
from dotenv import load_dotenv

# Config
load_dotenv()
st.set_page_config(page_title="LegisAI", page_icon="⚖️")

# UI
st.title("⚖️ Indian Legal Analyzer (Gemini)")


# Create tabs for different features
tab1, tab2 = st.tabs(["Document Analysis", "Case Research Chat"])

with tab1:
    # File Upload
    uploaded_file = st.file_uploader("Upload legal document (PDF)", type="pdf")

    if uploaded_file and st.button("Analyze"):
        with st.spinner("Processing document..."):
            # Save temp file
            temp_path = f"temp_{uploaded_file.name}"
            with open(temp_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Process PDF
            if text := extract_text_from_pdf(temp_path):
                os.remove(temp_path)
                
                # First check if it's a legal document
                if not is_legal_document(text[:2000]):  # Check first portion for efficiency
                    st.error("The uploaded document does not appear to be an Indian legal document. Please upload a valid legal document.")
                else:
                    # Handle large docs
                    if len(text.split()) > 2000:
                        chunks = chunk_text(text)
                        st.info(f"Document split into {len(chunks)} chunks for processing")
                        
                        results = []
                        progress_bar = st.progress(0)
                        
                        for i, chunk in enumerate(chunks):
                            chunk_result = analyze_legal_text(chunk, "summary", is_chunk=True)
                            results.append(chunk_result)
                            progress_bar.progress((i+1)/len(chunks))
                        
                        # Combine results intelligently instead of simple concatenation
                        result = combine_legal_analyses(results, "summary")
                    else:
                        result = analyze_legal_text(text, "summary", is_chunk=False)
                    
                    # Display
                    st.subheader("Results")
                    st.markdown(result)
                    st.download_button("Save Result", result, file_name="analysis.txt")
            else:
                st.error("Failed to extract text from PDF")

with tab2:
    st.subheader("Case Research Assistant")
    st.write("Describe your legal situation and find similar cases that may help understand how courts have ruled.")
    
    # Add guidance for legal queries
    with st.expander("Tips for effective legal queries"):
        st.markdown("""
        To get the best results, include information about:
        - The type of legal issue (e.g., property dispute, criminal case, family matter)
        - Relevant facts of your situation
        - Specific legal questions or concerns
        - Any particular laws or regulations involved
        
        **Examples:**
        - "What are my rights regarding property inheritance in India if my father dies without a will?"
        - "How have Indian courts ruled on cases involving workplace harassment?"
        - "What precedents exist for cases of defamation on social media in India?"
        """)
    
    # Add note about IndianKanoon links
    # st.info("Each case in the results will include a link to view the full case on IndianKanoon.")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Describe your legal situation..."):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Generate response
        with st.chat_message("assistant"):
            with st.spinner("Searching for similar cases..."):
                # Call the function to find similar cases
                response = find_similar_cases(prompt)
                
                # Check if the response indicates a non-legal query
                if response.startswith("Your query does not appear to be related to a legal situation"):
                    st.warning(response)
                else:
                    st.markdown(response)
                
                # Add assistant response to chat history
                st.session_state.messages.append({"role": "assistant", "content": response})

# Footer
st.divider()
st.caption("""
**Disclaimer**: AI-generated analysis. Verify with original documents.
Not a substitute for legal advice.
""")