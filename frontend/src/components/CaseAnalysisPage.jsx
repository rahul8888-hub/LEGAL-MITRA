import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFileUpload, 
  FaSearch, 
  FaHistory, 
  FaQuestion, 
  FaArrowRight, 
  FaRegLightbulb,
  FaGavel,
  FaClipboardList,
  FaBars,
  FaTimes,
  FaChevronRight
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000';

const CaseAnalysisPage = () => {
  // State management
  const [userId] = useState(localStorage.getItem('userId') || `user-${Math.random().toString(36).substring(2, 15)}`);
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [similarCaseQuery, setSimilarCaseQuery] = useState('');
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingFollowUp, setIsProcessingFollowUp] = useState(false);
  const [results, setResults] = useState(['', '', '', '']); // Store results for each tab
  const [followUpResults, setFollowUpResults] = useState(['', '']); // Store follow-up results for document and similar cases tabs
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [fileName, setFileName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Fetch user history on component mount
  useEffect(() => {
    localStorage.setItem('userId', userId);
    fetchHistory();
    
    // Handle sidebar based on screen size
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userId]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-history?user_id=${userId}`);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    } else {
      setFile(null);
      setFileName('');
      setError('Please upload a PDF file');
    }
  };

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  const handleSimilarCaseQueryChange = (e) => {
    setSimilarCaseQuery(e.target.value);
  };

  const handleFollowUpQueryChange = (e, tabIndex) => {
    if (tabIndex === 0 || tabIndex === 1) { 
      setFollowUpQuery(e.target.value);
    } else {
      // For the original follow-up tab
      setFollowUpQuery(e.target.value);
    }
  };

  const updateResults = (newResult) => {
    const updatedResults = [...results];
    updatedResults[activeTab] = newResult;
    setResults(updatedResults);
  };

  const updateFollowUpResults = (newResult, tabIndex) => {
    const updatedResults = [...followUpResults];
    updatedResults[tabIndex] = newResult;
    setFollowUpResults(updatedResults);
  };

  const analyzeDocument = async () => {
    if (!file && !textInput) {
      setError('Please upload a PDF file or enter text');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', textInput);
      }
      
      // Debug FormData properly
      console.log('FormData contents:');
      for (const pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/analyze-document`, formData);
      console.log(response);
      updateResults(response.data.result);
      setFollowUpResults(['', '']); // Clear follow-up results
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.result || 'Error analyzing document');
    } finally {
      setIsProcessing(false);
    }
  };

  const findSimilarCases = async () => {
    if (!similarCaseQuery) {
      setError('Please enter a legal query');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/find-similar-cases`, {
        query: similarCaseQuery,
        user_id: userId
      });
      updateResults(response.data.result);
      setFollowUpResults(['', '']); // Clear follow-up results
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Error finding similar cases');
    } finally {
      setIsProcessing(false);
    }
  };

  const askFollowUp = async (tabIndex) => {
    if (!followUpQuery) {
      setError('Please enter a follow-up question');
      return;
    }

    setIsProcessingFollowUp(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ask-follow-up`, {
        query: followUpQuery,
        user_id: userId
      });
      
      if (tabIndex === 0 || tabIndex === 1) {
        // For document analysis or similar cases tabs
        updateFollowUpResults(response.data.result, tabIndex);
      } else {
        // For the original follow-up tab
        updateResults(response.data.result);
      }
      
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Error getting follow-up answer');
    } finally {
      setIsProcessingFollowUp(false);
    }
  };

  const loadHistoryItem = (item) => {
    // Determine which tab this history item belongs to
    let tabIndex = 3; // Default to history tab
    
    if (item.type === 'document_analysis') tabIndex = 0;
    else if (item.type === 'similar_cases') tabIndex = 1;
    else if (item.type === 'follow_up') tabIndex = 2;
    
    // Update the results for the appropriate tab
    const updatedResults = [...results];
    updatedResults[tabIndex] = item.result;
    setResults(updatedResults);
    
    // Switch to the appropriate tab
    setActiveTab(tabIndex);
  };

  // Navigation items configuration
  const navItems = [
    { icon: <FaFileUpload className="w-5 h-5" />, title: "Document Analysis", color: "indigo" },
    { icon: <FaSearch className="w-5 h-5" />, title: "Similar Cases", color: "emerald" },
    { icon: <FaHistory className="w-5 h-5" />, title: "History", color: "purple" }
  ];

  // Result containers based on tab type
  const renderResult = (tabIndex) => {
    const result = results[tabIndex];
    if (!result) return null;

    const icons = [
      <FaRegLightbulb className="text-2xl text-indigo-600 mr-3" />,
      <FaGavel className="text-2xl text-emerald-600 mr-3" />,
      <FaClipboardList className="text-2xl text-amber-500 mr-3" />,
      <FaHistory className="text-2xl text-purple-600 mr-3" />
    ];
    
    const titles = [
      "Document Analysis",
      "Similar Cases Found",
      "Answer to Your Question",
      "Previous Result"
    ];
    
    const borderColors = [
      "border-indigo-600",
      "border-emerald-600",
      "border-amber-500",
      "border-purple-600"
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`mt-6 bg-white rounded-xl shadow-lg p-6 border-l-4 ${borderColors[tabIndex]}`}
      >
        <div className="flex items-center mb-4">
          {icons[tabIndex]}
          <h2 className="text-2xl font-bold text-gray-800">{titles[tabIndex]}</h2>
        </div>
        <div className="prose max-w-none">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
        
        {/* Add follow-up section directly below document analysis or similar cases results */}
        {(tabIndex === 0 || tabIndex === 1) && result && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 pt-4 border-t border-gray-200"
          >
            <h3 className="text-lg font-semibold flex items-center text-gray-700 mb-3">
              <FaQuestion className="mr-2 text-amber-500" />
              Follow-up Question
            </h3>
            <textarea 
              rows="3" 
              value={followUpQuery}
              onChange={(e) => handleFollowUpQueryChange(e, tabIndex)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              placeholder="Ask a follow-up question about this analysis..."
            />
            
            <button 
              onClick={() => askFollowUp(tabIndex)}
              disabled={isProcessingFollowUp}
              className={`mt-3 py-2 px-4 rounded-lg font-medium text-white flex items-center ${
                isProcessingFollowUp 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-600 transition'
              }`}
            >
              {isProcessingFollowUp ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Ask Question <FaArrowRight className="ml-2" />
                </>
              )}
            </button>
            
            {/* Display follow-up result if available */}
            {followUpResults[tabIndex] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-100"
              >
                <div className="flex items-center mb-2">
                  <FaClipboardList className="text-lg text-amber-500 mr-2" />
                  <h4 className="font-medium text-amber-800">Answer to Your Follow-up</h4>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{followUpResults[tabIndex]}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // File upload preview
  const renderFilePreview = () => {
    if (!fileName) return null;
    
    return (
      <div className="mt-2 py-2 px-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-center">
        <FaFileUpload className="mr-2" />
        <span className="font-medium">{fileName}</span>
      </div>
    );
  };

  // Sidebar toggle button - positioned outside the sidebar
  const ToggleButton = () => (
    <motion.button 
      initial={{ x: sidebarOpen ? 250 : 0 }}
      animate={{ x: sidebarOpen ? 250 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="fixed top-4 z-40 p-2 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 transition-all duration-300"
      style={{ left: sidebarOpen ? '8px' : '8px' }}
    >
      {sidebarOpen ? <FaTimes /> : <FaBars />}
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ToggleButton />
      
      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed z-20 left-0 top-0 h-full bg-white shadow-lg w-64 flex flex-col"
            >
              <div className="p-4 bg-indigo-600 text-white pt-14">
                <h2 className="text-xl font-bold">Legal Analysis</h2>
                <p className="text-sm text-indigo-100">Document Analysis Tool</p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2">Navigation</p>
                  
                  {navItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTab(index)}
                      className={`w-full my-1 flex items-center p-3 rounded-lg transition-all ${
                        activeTab === index 
                          ? `bg-${item.color}-100 text-${item.color}-700` 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`mr-3 text-${item.color}-600`}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.title}</span>
                      {activeTab === index && (
                        <FaChevronRight className={`ml-auto text-${item.color}-600`} />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="p-2 mt-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 ml-2">Recent History</p>
                  
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left p-2 rounded-lg hover:bg-gray-100 transition-all flex items-start"
                      >
                        {item.type === 'document_analysis' && <FaFileUpload className="text-purple-600 mr-2 mt-1 flex-shrink-0" />}
                        {item.type === 'similar_cases' && <FaSearch className="text-purple-600 mr-2 mt-1 flex-shrink-0" />}
                        {item.type === 'follow_up' && <FaQuestion className="text-purple-600 mr-2 mt-1 flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-medium line-clamp-1">
                            {item.document_preview || item.query || "Analysis"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    {history.length > 5 && (
                      <button 
                        onClick={() => setActiveTab(2)}
                        className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium p-2"
                      >
                        View All History →
                      </button>
                    )}
                    
                    {history.length === 0 && (
                      <p className="text-sm text-gray-500 p-2">No history yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <div 
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}
          style={{ minHeight: "100vh" }}
        >
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            {/* Sticky Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="sticky top-0 bg-white z-10 p-4 rounded-xl shadow-md mb-6"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-indigo-600">
                Indian Legal Document Analysis
              </h1>
              <p className="text-gray-600">
                {navItems[activeTab].title}: {navItems[activeTab].title === "Document Analysis" 
                  ? "Upload & analyze legal documents"
                  : navItems[activeTab].title === "Similar Cases" 
                  ? "Find cases similar to your situation"
                  : "View your previous document analyses and queries"}
              </p>
            </motion.div>
            
            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Tab Content */}
              <div className="p-4">
                {/* Document Analysis Panel */}
                {activeTab === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                      <div className="flex flex-col md:flex-row md:space-x-4">
                        <div className="md:w-1/2 mb-4 md:mb-0">
                          <label className="block text-gray-700 font-medium mb-2">Upload PDF Document</label>
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col rounded-lg border-2 border-dashed border-gray-300 w-full h-24 p-4 group text-center cursor-pointer hover:bg-gray-100">
                              <div className="h-full w-full text-center flex flex-col items-center justify-center">
                                <FaFileUpload className="text-xl text-gray-400 group-hover:text-indigo-600 mb-1" />
                                <p className="text-sm text-gray-500 group-hover:text-gray-700">Click to browse</p>
                                <p className="text-xs text-gray-500">PDF files only</p>
                              </div>
                              <input type="file" onChange={handleFileChange} className="hidden" accept="application/pdf" />
                            </label>
                          </div>
                          {renderFilePreview()}
                        </div>
                        
                        <div className="md:w-1/2">
                          <label className="block text-gray-700 font-medium mb-2">Or Paste Document Text</label>
                          <textarea 
                            rows="4" 
                            value={textInput}
                            onChange={handleTextInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="Paste legal document text here..."
                          />
                        </div>
                      </div>
                      
                      <button 
                        onClick={analyzeDocument}
                        disabled={isProcessing}
                        className={`mt-4 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 transition'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Analyze Document <FaArrowRight className="ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Display results for this tab */}
                    {renderResult(0)}
                  </motion.div>
                )}

                {/* Similar Cases Panel */}
                {activeTab === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                      <label className="block text-gray-700 font-medium mb-2">Describe Your Legal Situation</label>
                      <textarea 
                        rows="4" 
                        value={similarCaseQuery}
                        onChange={handleSimilarCaseQueryChange}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        placeholder="Describe the legal situation or issue you're facing in detail..."
                      />
                      
                      <button 
                        onClick={findSimilarCases}
                        disabled={isProcessing}
                        className={`mt-4 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center ${
                          isProcessing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 transition'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Searching...
                          </>
                        ) : (
                          <>
                            Find Similar Cases <FaArrowRight className="ml-2" />
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Display results for this tab */}
                    {renderResult(1)}
                  </motion.div>
                )}

                {/* History Panel */}
                {activeTab === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {history.length === 0 ? (
                      <div className="bg-gray-50 p-10 rounded-xl border border-gray-200 text-center">
                        <FaHistory className="text-4xl text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No history yet. Analyze documents or ask questions to see them here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {history.map((item, index) => (
                          <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="bg-white p-4 rounded-lg shadow hover:shadow-md border-l-4 border-purple-600 cursor-pointer transition-all" 
                            onClick={() => loadHistoryItem(item)}
                          >
                            {item.type === 'document_analysis' && (
                              <>
                                <div className="flex items-center mb-2">
                                  <FaFileUpload className="text-purple-600 mr-2" />
                                  <h3 className="font-semibold text-lg">Document Analysis</h3>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.document_preview}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(item.timestamp || Date.now()).toLocaleString()}</p>
                              </>
                            )}
                            {item.type === 'similar_cases' && (
                              <>
                                <div className="flex items-center mb-2">
                                  <FaSearch className="text-purple-600 mr-2" />
                                  <h3 className="font-semibold text-lg">Similar Cases Query</h3>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.query}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(item.timestamp || Date.now()).toLocaleString()}</p>
                              </>
                            )}
                            {item.type === 'follow_up' && (
                              <>
                                <div className="flex items-center mb-2">
                                  <FaQuestion className="text-purple-600 mr-2" />
                                  <h3 className="font-semibold text-lg">Follow-up Question</h3>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{item.query}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(item.timestamp || Date.now()).toLocaleString()}</p>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Display selected history result */}
                    {renderResult(3)}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>{error}</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseAnalysisPage;