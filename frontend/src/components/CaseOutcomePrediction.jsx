import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const CaseOutcomePrediction = () => {
  const [formData, setFormData] = useState({
    case_type: '',
    jurisdiction: '',
    accuser: '',
    accused: '',
    victim: '',
    case_description: '',
    timeline: '',
    evidence: '',
    previous_legal_history: ''
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5010/api/analyze-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnalysisResult(data);
      setActiveTab('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const caseTypes = [
    'Civil - Contract Dispute',
    'Civil - Property Dispute',
    'Civil - Tort',
    'Criminal - Theft',
    'Criminal - Assault',
    'Family - Divorce',
    'Family - Custody',
    'Corporate - IP'
  ];

  const jurisdictions = [
    'Delhi High Court',
    'Mumbai High Court',
    'Supreme Court of India',
    'National Consumer Disputes Redressal Commission',
    'National Company Law Tribunal'
  ];

  const getWinProbabilityColor = (probability) => {
    if (probability < 30) return '#ef4444'; // Red
    if (probability < 50) return '#f97316'; // Orange
    if (probability < 70) return '#facc15'; // Yellow
    return '#22c55e'; // Green
  };

  const renderPieChart = () => {
    const winProb = analysisResult.win_probability;
    const pieData = [
      { name: 'Win Probability', value: winProb },
      { name: 'Loss Probability', value: 100 - winProb }
    ];
    const COLORS = [getWinProbabilityColor(winProb), '#94a3b8'];

    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            label={({name, value}) => `${name}: ${value}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderFactorsBarChart = () => {
    const strengths = analysisResult.strengths.map((str, i) => ({ 
      name: `S${i+1}`, 
      full: str, 
      value: 1, 
      type: 'Strength' 
    }));
    
    const weaknesses = analysisResult.weaknesses.map((weak, i) => ({ 
      name: `W${i+1}`, 
      full: weak, 
      value: -1, 
      type: 'Weakness' 
    }));
    
    const data = [...strengths, ...weaknesses];

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Case Factors Impact</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" domain={[-1, 1]} />
            <YAxis type="category" dataKey="name" />
            <Tooltip content={({active, payload}) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p>{payload[0].payload.full}</p>
                  </div>
                );
              }
              return null;
            }} />
            
            <Bar dataKey="value">
            {data.map((entry, index) => (
                <Cell
                key={`cell-${index}`}
                fill={entry.type === 'Strength' ? '#22c55e' : '#ef4444'}
                />
            ))}
            </Bar>

          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-2 text-xs text-gray-500">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-green-500 mr-1"></div>
            <span>Strengths</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 mr-1"></div>
            <span>Weaknesses</span>
          </div>
        </div>
      </div>
    );
  };

  // Custom Select Component
  const CustomSelect = ({ name, value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="relative">
        <button
          type="button"
          className="w-full px-4 py-2 text-left border rounded-md bg-white flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`${value ? '' : 'text-gray-400'}`}>
            {value || placeholder}
          </span>
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <div
                key={option}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onChange(name, option);
                  setIsOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md border overflow-hidden w-full">
        {/* Card Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Case Outcome Prediction</h2>
          <p className="text-gray-500 mt-1">
            Fill in the case details below to receive an AI-powered legal analysis and outcome prediction.
          </p>
        </div>
        
        {/* Card Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 w-full border rounded-md overflow-hidden">
              <button 
                className={`py-2 text-center font-medium ${activeTab === 'input' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setActiveTab('input')}
              >
                Case Details
              </button>
              <button 
                className={`py-2 text-center font-medium ${activeTab === 'results' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setActiveTab('results')}
                disabled={!analysisResult}
              >
                Results & Analysis
              </button>
            </div>
          </div>
          
          {/* Input Form Tab Content */}
          {activeTab === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="case_type" className="block text-sm font-medium text-gray-700">Case Type</label>
                  <CustomSelect 
                    name="case_type" 
                    value={formData.case_type}
                    onChange={handleSelectChange}
                    options={caseTypes}
                    placeholder="Select case type"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="jurisdiction" className="block text-sm font-medium text-gray-700">Jurisdiction</label>
                  <CustomSelect 
                    name="jurisdiction" 
                    value={formData.jurisdiction}
                    onChange={handleSelectChange}
                    options={jurisdictions}
                    placeholder="Select jurisdiction"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="accuser" className="block text-sm font-medium text-gray-700">Accuser/Plaintiff*</label>
                  <input
                    id="accuser"
                    name="accuser"
                    required
                    value={formData.accuser}
                    onChange={handleInputChange}
                    placeholder="Name of accuser/plaintiff"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="accused" className="block text-sm font-medium text-gray-700">Accused/Defendant*</label>
                  <input
                    id="accused"
                    name="accused"
                    required
                    value={formData.accused}
                    onChange={handleInputChange}
                    placeholder="Name of accused/defendant"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="victim" className="block text-sm font-medium text-gray-700">Victim (if applicable)</label>
                  <input
                    id="victim"
                    name="victim"
                    value={formData.victim}
                    onChange={handleInputChange}
                    placeholder="Name of victim if different"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="case_description" className="block text-sm font-medium text-gray-700">Case Description*</label>
                <textarea
                  id="case_description"
                  name="case_description"
                  required
                  value={formData.case_description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed description of the case"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">Timeline</label>
                <textarea
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="Chronological timeline of relevant events"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="evidence" className="block text-sm font-medium text-gray-700">Evidence</label>
                <textarea
                  id="evidence"
                  name="evidence"
                  value={formData.evidence}
                  onChange={handleInputChange}
                  placeholder="List any available evidence"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="previous_legal_history" className="block text-sm font-medium text-gray-700">Previous Legal History</label>
                <textarea
                  id="previous_legal_history"
                  name="previous_legal_history"
                  value={formData.previous_legal_history}
                  onChange={handleInputChange}
                  placeholder="Any relevant legal history of parties involved"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-2 px-4 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Case'
                )}
              </button>
            </form>
          )}
          
          {/* Results Tab Content */}
          {activeTab === 'results' && analysisResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Win Probability Card */}
                <div className="border rounded-lg shadow-sm p-4">
                  <div className="border-b pb-3 mb-3">
                    <h3 className="text-lg font-semibold">Win Probability</h3>
                  </div>
                  <div className="flex justify-center items-center">
                    {renderPieChart()}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-3xl font-bold" style={{ color: getWinProbabilityColor(analysisResult.win_probability) }}>
                      {analysisResult.win_probability}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Confidence Score: {analysisResult.confidence_score}%
                    </div>
                  </div>
                </div>
                
                {/* Case Factors Analysis Card */}
                <div className="border rounded-lg shadow-sm p-4">
                  <div className="border-b pb-3 mb-3">
                    <h3 className="text-lg font-semibold">Case Factors Analysis</h3>
                  </div>
                  {renderFactorsBarChart()}
                </div>
              </div>
              
              {/* Key Factors Card */}
              <div className="border rounded-lg shadow-sm p-4">
                <div className="border-b pb-3 mb-3">
                  <h3 className="text-lg font-semibold">Key Factors</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResult.key_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
              
              {/* Legal Arguments Card */}
              <div className="border rounded-lg shadow-sm p-4">
                <div className="border-b pb-3 mb-3">
                  <h3 className="text-lg font-semibold">Legal Arguments</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      For Plaintiff
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.legal_arguments.plaintiff.map((arg, index) => (
                        <li key={index}>{arg}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <XCircle className="h-4 w-4 mr-1 text-red-500" />
                      For Defendant
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysisResult.legal_arguments.defendant.map((arg, index) => (
                        <li key={index}>{arg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Applicable Laws Card */}
              <div className="border rounded-lg shadow-sm p-4">
                <div className="border-b pb-3 mb-3">
                  <h3 className="text-lg font-semibold">Applicable Laws</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Law</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.applicable_laws.map((law, index) => (
                        <tr key={index}>
                          <td className="border p-2">{law.name}</td>
                          <td className="border p-2">{law.description}</td>
                          <td className="border p-2">
                            <a 
                              href={law.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View on Indian Kanoon
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Settlement Recommendation Card */}
              {analysisResult.settlement_recommendation.recommended && (
                <div className="border border-orange-300 rounded-lg shadow-sm">
                  <div className="bg-orange-50 p-4 border-b border-orange-300">
                    <h3 className="text-lg font-semibold flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                      Settlement Recommendation
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <p><strong>Why settle: </strong>{analysisResult.settlement_recommendation.reason}</p>
                      <p><strong>Strategy: </strong>{analysisResult.settlement_recommendation.strategy}</p>
                      
                      <div>
                        <h4 className="font-medium mb-1">Potential Terms:</h4>
                        <ul className="list-disc pl-5">
                          {analysisResult.settlement_recommendation.potential_terms.map((term, index) => (
                            <li key={index}>{term}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Similar Cases Card */}
              <div className="border rounded-lg shadow-sm p-4">
                <div className="border-b pb-3 mb-3">
                  <h3 className="text-lg font-semibold">Similar Cases</h3>
                </div>
                <div className="space-y-4">
                  {analysisResult.similar_cases.map((caseItem, index) => (
                    <div key={index} className="border p-3 rounded-md">
                      <h4 className="font-medium">{caseItem.case_name}</h4>
                      <p className="text-sm text-gray-600">Citation: {caseItem.citation}</p>
                      <p><strong>Outcome:</strong> {caseItem.outcome}</p>
                      <p><strong>Relevance:</strong> {caseItem.relevance}</p>
                      <a 
                        href={caseItem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View on Indian Kanoon
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <p className="text-xs text-gray-500">
            Disclaimer: This prediction is based on AI analysis and should not replace professional legal advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaseOutcomePrediction;