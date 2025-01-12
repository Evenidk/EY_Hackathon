'use client';
import React, { useState } from 'react';
import { Bell, Search, Menu, X, ChevronRight, FileCheck, Users, Calendar } from 'lucide-react';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dummy data
  const schemes = [
    {
      id: 1,
      name: 'PM Kisan Scheme',
      description: 'Financial assistance for farmers',
      status: 'Available',
      eligibility: 'Farmers with land ownership',
      documents: ['Land Records', 'Aadhaar Card', 'Bank Details']
    },
    {
      id: 2,
      name: 'Ayushman Bharat',
      description: 'Healthcare benefits for families',
      status: 'Available',
      eligibility: 'Low income families',
      documents: ['Income Certificate', 'Aadhaar Card', 'Ration Card']
    }
  ];

  const applications = [
    {
      id: 1,
      scheme: 'PM Kisan Scheme',
      status: 'In Progress',
      submittedDate: '2024-01-10',
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      scheme: 'Ayushman Bharat',
      status: 'Pending Verification',
      submittedDate: '2024-01-05',
      lastUpdated: '2024-01-12'
    }
  ];

  const notifications = [
    {
      id: 1,
      title: 'Document Verification Complete',
      message: 'Your documents for PM Kisan Scheme have been verified',
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'New Scheme Available',
      message: 'You might be eligible for the new education scheme',
      time: '1 day ago'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600">Digital Seva</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-400 cursor-pointer hover:text-gray-500" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out z-30`}>
        <div className="flex flex-col h-full w-64 bg-white border-r">
          <div className="flex-1 flex flex-col pt-20 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileCheck className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('schemes')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'schemes' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Schemes
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${
                  activeTab === 'applications' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="mr-3 h-5 w-5" />
                Applications
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Latest Notifications</h2>
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Bell className="h-6 w-6 text-blue-500" />
                        <div>
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
                    <div className="space-y-4">
                      {applications.slice(0, 2).map(application => (
                        <div key={application.id} className="border-l-4 border-blue-500 p-4 bg-gray-50">
                          <h3 className="font-medium">{application.scheme}</h3>
                          <p className="text-sm text-gray-600">Status: {application.status}</p>
                          <p className="text-xs text-gray-500">Last updated: {application.lastUpdated}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Recommended Schemes</h2>
                    <div className="space-y-4">
                      {schemes.slice(0, 2).map(scheme => (
                        <div key={scheme.id} className="border p-4 rounded-lg">
                          <h3 className="font-medium">{scheme.name}</h3>
                          <p className="text-sm text-gray-600">{scheme.description}</p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                            Check Eligibility
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schemes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Available Schemes</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search schemes..."
                      className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {schemes.map(scheme => (
                    <div key={scheme.id} className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-2">{scheme.name}</h3>
                      <p className="text-gray-600 mb-4">{scheme.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Status:</span> {scheme.status}</p>
                        <p className="text-sm"><span className="font-medium">Eligibility:</span> {scheme.eligibility}</p>
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Required Documents:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600">
                            {scheme.documents.map((doc, index) => (
                              <li key={index}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <button className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">My Applications</h2>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scheme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map(application => (
                        <tr key={application.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{application.scheme}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {application.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.submittedDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.lastUpdated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-blue-600 hover:text-blue-700">View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;