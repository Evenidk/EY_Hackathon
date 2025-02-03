// digital-seva\app\Lower.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, Camera, Languages, BellRing, Settings, User, Filter, TrendingUp, Clock, MessageSquare 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DocumentScanner from './components/DocumentScanner';

const GovtServicesPlatform = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [notifications, setNotifications] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: 'Priya',
    location: 'Madhya Pradesh',
    familySize: 4,
    monthlyIncome: 10000,
    appliedSchemes: [1, 2],  // This should be an array of applied scheme IDs
    savedSchemes: [3]        // Array for saved schemes
  });
  
  // Sample analytics data
  const analyticsData = [
    { month: 'Jan', applications: 2, savings: 4000 },
    { month: 'Feb', applications: 3, savings: 6000 },
    { month: 'Mar', applications: 4, savings: 8000 }
  ];

  // Simulated AI recommendations based on user profile
  const getAIRecommendations = () => {
    const recommendations = schemes.filter(scheme => 
      (scheme.eligibilityCriteria.maxIncome >= userProfile.monthlyIncome) &&
      !userProfile.appliedSchemes.includes(scheme.id) // Checking if scheme.id is not in appliedSchemes
    );
    return recommendations.slice(0, 3);
  };
  
  const schemes = [
    {
      id: 1,
      title: "PM Kisan Samman Nidhi",
      category: "agriculture",
      description: "Direct income support for farmer families",
      eligibilityCriteria: {
        maxIncome: 15000,
        occupation: "farmer",
        landSize: "< 2 hectares"
      },
      benefits: [
        "₹6000 annual financial support",
        "Direct bank transfer",
        "No middlemen involved"
      ],
      documents: ["Aadhaar Card", "Land Records", "Bank Account Details"],
      status: "Eligible",
      nextStep: "Document Verification",
      applicationDeadline: "2024-12-31",
      processingTime: "30 days",
      successRate: "92%",
      beneficiaries: "11.37 Cr",
      verificationStatus: {
        aadhaar: true,
        landRecords: false,
        bankAccount: true
      }
    },
    // ... more schemes
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">सरकारी सेवाएं</h1>
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
              <Languages className="h-4 w-4 mr-2" />
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent"
              >
                <option value="english">English</option>
                <option value="hindi">हिंदी</option>
                <option value="marathi">मराठी</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BellRing className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center bg-blue-50 rounded-full px-4 py-2">
              <User className="h-4 w-4 mr-2" />
              <span>{userProfile.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* AI Assistant Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DocumentScanner />

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle>Eligibility Checker</CardTitle>
              <CardDescription className="text-green-100">
                Find schemes you qualify for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button className="flex items-center space-x-2 bg-white text-green-600 px-4 py-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Check Eligibility</span>
              </button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle>24/7 AI Support</CardTitle>
              <CardDescription className="text-purple-100">
                Get instant help in your language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                onClick={() => setShowAIChat(true)}
                className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-lg"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Start Chat</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - User Profile & Progress */}
          <div className="col-span-12 md:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">{userProfile.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Family Size</span>
                    <span className="font-medium">{userProfile.familySize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Income</span>
                    <span className="font-medium">₹{userProfile.monthlyIncome}</span>
                  </div>
                  <button className="w-full mt-4 bg-gray-100 text-gray-600 py-2 rounded-lg hover:bg-gray-200">
                    Update Profile
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Applied Schemes</span>
                      <span className="font-medium">{userProfile.appliedSchemes.length}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Documents Verified</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full w-2/3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 md:col-span-9 space-y-6">
            {/* Search and Filters */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schemes or ask a question..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="px-4 py-2 bg-white border rounded-lg flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Recommended for You</span>
                </CardTitle>
                <CardDescription>
                  Based on your profile and eligibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAIRecommendations().map((scheme) => (
                    <Card key={scheme.id} className="bg-blue-50 border-blue-100">
                      <CardHeader>
                        <CardTitle className="text-lg">{scheme.title}</CardTitle>
                        <CardDescription>{scheme.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span>You match {scheme.successRate} criteria</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            <span>Processing time: {scheme.processingTime}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                          Apply Now
                        </button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Your Benefits Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line yAxisId="left" type="monotone" dataKey="applications" stroke="#2563eb" />
                      <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#16a34a" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      {showAIChat && (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setShowAIChat(false)} className="text-gray-500">
              ✕
            </button>
          </div>
          <div className="h-96 p-4 overflow-y-auto">
            {/* Chat messages would go here */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              Hello Priya! How can I help you today? I can help you:
              <ul className="mt-2 space-y-1">
                <li>• Find schemes you're eligible for</li>
                <li>• Check application status</li>
                <li>• Verify documents</li>
                <li>• Calculate benefits</li>
              </ul>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded-lg"
              />
              <button className="bg-blue-500 text-white p-2 rounded-lg">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovtServicesPlatform;
