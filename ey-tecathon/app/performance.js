"use client";
import React, { useState } from 'react';
import { MessageCircle, FileText, MapPin, Bell, Upload, Check, BarChart2, Compass, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const schemes = [
  { 
    id: 1, 
    name: 'PM Kisan Samman Nidhi', 
    eligibility: 'Small and marginal farmers', 
    documents: ['Aadhar Card', 'Land Records'],
    benefitAmount: '₹6,000 per year',
    deadline: '2025-03-31',
    applicants: 2456,
    successRate: 85
  },
  { 
    id: 2, 
    name: 'Pradhan Mantri Awas Yojana', 
    eligibility: 'Rural households without a house', 
    documents: ['Income Certificate', 'Residence Proof'],
    benefitAmount: 'Up to ₹1,20,000',
    deadline: '2025-06-30',
    applicants: 1832,
    successRate: 72
  },
  { 
    id: 3, 
    name: 'National Pension Scheme', 
    eligibility: 'Citizens aged 18-65 years', 
    documents: ['Aadhar Card', 'PAN Card'],
    benefitAmount: 'Based on contribution',
    deadline: '2025-12-31',
    applicants: 3241,
    successRate: 91
  }
];

const stats = [
  { name: 'Processing Time', traditional: 72, aiPowered: 24 },
  { name: 'Error Rate', traditional: 15, aiPowered: 3 },
  { name: 'User Satisfaction', traditional: 65, aiPowered: 92 }
];

const serviceLocations = [
  { id: 1, name: 'Delhi Center', address: 'Connaught Place, New Delhi', waitTime: '15 mins' },
  { id: 2, name: 'Mumbai Center', address: 'Bandra West, Mumbai', waitTime: '30 mins' },
  { id: 3, name: 'Bangalore Center', address: 'MG Road, Bangalore', waitTime: '20 mins' }
];

const DigitalSeva = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [documents, setDocuments] = useState([]);
  const [eligibilityData, setEligibilityData] = useState({
    age: '',
    income: '',
    location: '',
    occupation: ''
  });

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setChatMessages([
      ...chatMessages,
      { sender: 'user', text: userInput },
      { 
        sender: 'bot', 
        text: `I'll help you with your query about ${userInput}. Would you like to: 1) Check eligibility, 2) View documents, or 3) Find a center?`
      }
    ]);
    setUserInput('');
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments(prev => [...prev, {
        name: file.name,
        status: 'Verifying',
        uploadDate: new Date().toLocaleDateString()
      }]);
      
      setTimeout(() => {
        setDocuments(docs => 
          docs.map(doc => 
            doc.name === file.name ? { ...doc, status: 'Verified' } : doc
          )
        );
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Digital Seva</h1>
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              US
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[
                    { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
                    { id: 'schemes', icon: Compass, label: 'Schemes' },
                    { id: 'documents', icon: FileText, label: 'Upload' },
                    { id: 'chat', icon: MessageCircle, label: 'Support' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 ${
                        activeTab === id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Welcome to Digital Seva! We've helped over 10,000 citizens access government schemes this month.
                  </AlertDescription>
                </Alert>
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="traditional" name="Traditional" fill="#93c5fd" />
                          <Bar dataKey="aiPowered" name="AI-Powered" fill="#2563eb" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'schemes' && (
              <div className="space-y-4">
                {schemes.map((scheme) => (
                  <Card key={scheme.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{scheme.name}</h3>
                          <p className="text-gray-600 mt-1">Eligibility: {scheme.eligibility}</p>
                          <p className="text-blue-600 mt-1">Benefit: {scheme.benefitAmount}</p>
                          <div className="mt-2">
                            <p className="text-sm font-medium">Required Documents:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {scheme.documents.map((doc) => (
                                <li key={doc}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          Apply Now
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Document Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      onChange={handleDocumentUpload}
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-12 w-12 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                      <span className="text-xs text-gray-500">PDF, JPG, PNG (max. 10MB)</span>
                    </label>
                  </div>
                  {documents.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>{doc.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={doc.status === 'Verified' ? 'text-green-600' : 'text-yellow-600'}>
                              {doc.status}
                            </span>
                            {doc.status === 'Verified' ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 rounded-full border-t-transparent" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'chat' && (
              <Card>
                <CardContent className="p-6">
                  <div className="h-96 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalSeva;