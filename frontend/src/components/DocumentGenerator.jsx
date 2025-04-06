import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaFileAlt, FaSpinner } from "react-icons/fa";

const DocumentGenerator = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update form fields when template changes
  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      const initialData = {};
      templates[selectedTemplate].placeholders.forEach((field) => {
        initialData[field] = "";
      });
      setFormData(initialData);
    } else {
      setFormData({});
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("http://localhost:5005/api/templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setMessage({
        text: "Failed to fetch templates. Please try again later.",
        type: "error",
      });
    }
  };

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
    setMessage({ text: "", type: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("http://localhost:5005/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_type: selectedTemplate,
          user_inputs: formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful document generation
        downloadDocument(data.document, data.filename);
        setMessage({
          text: "Document generated successfully!",
          type: "success",
        });
      } else {
        throw new Error(data.error || "Failed to generate document");
      }
    } catch (error) {
      console.error("Error generating document:", error);
      setMessage({
        text: error.message || "An error occurred while generating the document.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = (base64Data, filename) => {
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Data}`;
    link.download = filename;
    link.click();
  };

  const groupedFields = (fields) => {
    // Group fields for better layout
    const groups = [];
    for (let i = 0; i < fields.length; i += 2) {
      groups.push(fields.slice(i, i + 2));
    }
    return groups;
  };

  const formatFieldLabel = (field) => {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-6 md:px-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-600 mb-3">
            Legal Document Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Create professional legal documents tailored to your needs. Select a template and fill in the details to generate your document.
          </p>
        </motion.div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="p-8">
            <div className="mb-8">
              <label
                htmlFor="template"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Select Document Template
              </label>
              <select
                id="template"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedTemplate}
                onChange={handleTemplateChange}
              >
                <option value="">-- Select a template --</option>
                {Object.keys(templates).map((key) => (
                  <option key={key} value={key}>
                    {templates[key].title} - {templates[key].description}
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && templates[selectedTemplate] && (
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <FaFileAlt className="text-indigo-600 text-xl mr-2" />
                    <h3 className="text-xl font-semibold text-indigo-600">
                      {templates[selectedTemplate].title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {templates[selectedTemplate].description}
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Enter Document Details
                </h3>

                {groupedFields(templates[selectedTemplate].placeholders).map(
                  (group, groupIndex) => (
                    <div key={groupIndex} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {group.map((field) => (
                        <div key={field} className="mb-4">
                          <label
                            htmlFor={field}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {formatFieldLabel(field)}
                          </label>
                          {field.includes("details") || field.includes("clause") ? (
                            <textarea
                              id={field}
                              name={field}
                              rows="3"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={formData[field] || ""}
                              onChange={handleInputChange}
                              required
                            />
                          ) : (
                            <input
                              type="text"
                              id={field}
                              name={field}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={formData[field] || ""}
                              onChange={handleInputChange}
                              required
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}

                <div className="mt-8 flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-indigo-600 text-white rounded-lg transition-all duration-300 
                             flex items-center justify-center border border-transparent
                             hover:bg-white hover:text-indigo-600 hover:border-indigo-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Document
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {!selectedTemplate && (
              <div className="text-center py-12">
                <FaFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Select a template to start generating your legal document
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <p className="text-gray-600 italic">
            All documents comply with Indian legal standards and requirements
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentGenerator;