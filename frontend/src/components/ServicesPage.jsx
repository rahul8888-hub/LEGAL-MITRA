import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

// Import icons
import { FaRobot, FaFileAlt, FaBalanceScale, FaSearch, FaUserTie } from "react-icons/fa";
import DocumentGenerator from "./DocumentGenerator";
import CaseOutcomePrediction from "./CaseOutcomePrediction";

const ServicesPage = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 1,
      title: "Chat with Legal Documents",
      description: "Upload legal documents and get instant insights or search cases related to specific legal incidents. Our AI assistant helps analyze legal documents and provides clear explanations.",
      icon: <FaRobot className="text-5xl text-indigo-600 mb-4" />,
      buttonText: "Start Chatting",
      path: "/compute",
      delay: 0.1,
    },
    {
      id: 2,
      title: "Build Legal Documents",
      description: "Create professional legal documents tailored to your needs. Select a template and fill in the details to generate comprehensive legal documents compliant with Indian law.",
      icon: <FaFileAlt className="text-5xl text-indigo-600 mb-4" />,
      buttonText: "Create Document",
      path: "/generate",
      delay: 0.2,
    },
    {
      id: 3,
      title: "Case Outcome Prediction",
      description: "Get AI-powered legal analysis and outcome predictions based on evidences, timelines, and case details. Understand potential outcomes for your specific legal scenario.",
      icon: <FaBalanceScale className="text-5xl text-indigo-600 mb-4" />,
      buttonText: "Predict Outcome",
      path: "/outcome",
      delay: 0.3,
    },
    {
      id: 4,
      title: "Find Suitable Lawyers",
      description: "Connect with lawyers specializing in your specific legal scenario. Our system matches you with legal professionals based on your case requirements and location.",
      icon: <FaUserTie className="text-5xl text-indigo-600 mb-4" />,
      buttonText: "Find Lawyers",
      path: "/lawyers",
      delay: 0.4,
    },
  ];

  return (
    <div>
        <Navbar />
      <div className="min-h-screen bg-white mt-25" id="Compute">
        <div className="container mx-auto px-6 md:px-12">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-indigo-600 mb-3">
              Empower Your Legal Practice
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              LegalMinds AI provides smart tools for legal research, document review, and case analysis — All with strong ethical standards and compliance with Indian legal frameworks.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {services.map((service) => (
              <motion.div
                key={service.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 
                           hover:shadow-2xl hover:bg-gray-50 transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: service.delay }}
              >
                <div className="p-6">
                  <div className="flex justify-center">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 text-justify mb-6 h-28 leading-relaxed text-sm">
                    {service.description}
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate(service.path)}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg transition-all duration-300 
                                 flex items-center justify-center border border-transparent
                                 hover:bg-white hover:text-indigo-600 hover:border-indigo-600"
                    >
                      {service.buttonText}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <p className="text-gray-600 italic">
              All features comply with Indian legal ethics guidelines and Bar Council regulations.
            </p>
          </motion.div>
        </div>
      </div>
      <DocumentGenerator/>
      <CaseOutcomePrediction/>
    </div>
  );
};

export default ServicesPage;