# LegisAI: Indian Legal Document Analysis

LegisAI is an AI-powered legal document analysis tool designed specifically for Indian legal documents. It uses Google's Gemini AI to analyze legal documents, extract key information, and provide insights.

## Features

### Document Analysis
- Upload and analyze Indian legal documents (PDF)
- Extract key information including case names, legal provisions, and citations
- Generate comprehensive summaries of legal documents

### Case Research Chat
- Describe your legal situation in natural language
- Find similar cases from Indian courts using AI-powered analysis
- Get analysis of how these precedents might apply to your situation
- Understand key legal issues and considerations

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/legisai.git
cd legisai
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory with your API key:
```
GEMINI_API_KEY=your_gemini_api_key
```

## Usage

1. Start the application:
```bash
streamlit run main.py
```

2. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:8501)

3. Use the application:
   - Upload a legal document for analysis
   - Use the chat interface to find similar cases

## Ethical Considerations

This application is designed with ethical considerations in mind:
- Clear disclaimers that AI-generated analysis is not a substitute for legal advice
- Transparency about the source of information
- Compliance with Indian legal advertising restrictions
- Focus on providing information rather than legal advice

## Future Enhancements

- Integration with legal databases for more comprehensive case search
- Advanced document structure recognition
- Citation network visualization
- Multi-format document support
- Customizable analysis options

## License

MIT

## Disclaimer

This application is for informational purposes only and is not a substitute for professional legal advice. Always consult with a qualified legal professional for advice on your specific situation. 