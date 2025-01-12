"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const [schemes, setSchemes] = useState([]);
  const [applications, setApplications] = useState([]);
  const router = useRouter();
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [documents, setDocuments] = useState([]);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchSchemes();
    fetchApplications();
  }, []);
  
  const fetchSchemes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/schemes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSchemes(data);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  };
  
  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  
  const handleDocumentUpload = async (e, schemeId) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    setDocuments(prev => [...prev, ...newDocuments]);
  };
  
  const handleApply = async (schemeId) => {
    try {
      const response = await fetch('http://localhost:3001/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          schemeId,
          documents
        })
      });
      
      const data = await response.json();
      setApplications(prev => [...prev, data]);
      setDocuments([]);
      setSelectedScheme(null);
    } catch (error) {
      console.error('Error applying for scheme:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Digital Seva Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Available Schemes */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Available Schemes</h2>
            <div className="space-y-4">
              {schemes.map(scheme => (
                <div key={scheme._id} className="border p-4 rounded">
                  <h3 className="font-medium">{scheme.name}</h3>
                  <p className="text-gray-600 text-sm mt-2">{scheme.description}</p>
                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedScheme(scheme)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* My Applications */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">My Applications</h2>
            <div className="space-y-4">
              {applications.map(application => (
                <div key={application._id} className="border p-4 rounded">
                  <h3 className="font-medium">{application.schemeId.name}</h3>
                  <p className="text-sm mt-2">
                    Status: <span className="font-medium">{application.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Applied on: {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Application Modal */}
        {selectedScheme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full">
              <h2 className="text-xl font-semibold mb-4">Apply for {selectedScheme.name}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Required Documents:</h3>
                  <ul className="list-disc pl-4">
                    {selectedScheme.requiredDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Upload Documents</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleDocumentUpload(e, selectedScheme._id)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setSelectedScheme(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApply(selectedScheme._id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;