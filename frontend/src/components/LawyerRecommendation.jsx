import React, { useState } from 'react';
import axios from 'axios';

function LawyerRecommendation() {
  const [caseDescription, setCaseDescription] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [caseAnalysis, setCaseAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);
    setCaseAnalysis(null);
    
    try {
      const response = await axios.post('http://localhost:5020/api/recommend', {
        caseDescription: caseDescription.trim()
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      
      if (!response.data.recommendations || response.data.recommendations.length === 0) {
        setError('No suitable lawyers found for your case');
        return;
      }
      
      setRecommendations(response.data.recommendations);
      setCaseAnalysis(response.data.case_analysis);
    } catch (err) {
      console.error('API Error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(err.response.data.error || 'Error getting recommendations');
      } else if (err.request) {
        // The request was made but no response was received
        setError('Could not connect to the server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-600 sm:text-4xl">
            Find Your Perfect Legal Match
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Describe your case and we'll recommend the most suitable lawyers for you.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="caseDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your case in detail
                </label>
                <textarea
                  id="caseDescription"
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  placeholder="Please include all relevant details about your legal situation..."
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                  rows="6"
                />
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                    loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Your Case...
                    </span>
                  ) : (
                    'Find Lawyers'
                  )}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 mx-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {caseAnalysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 mx-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Case Analysis</h3>
              <div className="text-sm text-blue-700">
                <p><span className="font-medium">Case Type:</span> {caseAnalysis.case_type}</p>
                <p className="mt-1"><span className="font-medium">Legal Areas:</span> {caseAnalysis.specializations.join(', ')}</p>
                <p className="mt-1"><span className="font-medium">Appropriate Court:</span> {caseAnalysis.court_level}</p>
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="px-6 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Lawyers</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((lawyer, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2">
                      <h3 className="text-lg font-bold text-white truncate">{lawyer.name}</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Specializations:</span><br />
                        {lawyer.specialization.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Practices in:</span><br />
                        {lawyer.court}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500">Average Fees</p>
                            <p className="text-lg font-bold text-blue-700">₹{lawyer.avg_fees.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Consultation</p>
                            <p className="text-lg font-bold text-blue-700">₹{lawyer.consultation_fees.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out">
                          Contact Lawyer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This recommendation system helps you find the right lawyer for your case based on specialization, court level, and fees.</p>
        </div>
      </div>
    </div>
  );
}

export default LawyerRecommendation;