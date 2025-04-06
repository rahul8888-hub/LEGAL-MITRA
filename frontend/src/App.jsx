import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import ServicesPage from './components/ServicesPage.jsx'
import CaseAnalysisPage from './components/CaseAnalysisPage.jsx'
import DocumentGenerator from './components/DocumentGenerator.jsx'
import CaseOutcomePrediction from './components/CaseOutcomePrediction.jsx'
import LawyerRecommendation from './components/LawyerRecommendation.jsx'

const App = () => {
  return (
    <Router>
      <div className=''>
        <Routes>
          <Route path="/" element={<Header />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/generate" element={<DocumentGenerator />} />
          <Route path="/compute" element={<CaseAnalysisPage />} />
          <Route path="/outcome" element={<CaseOutcomePrediction />} />
          <Route path="/lawyers" element={<LawyerRecommendation />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App