// digital-seva\app\Middle.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  Users,
  FileText,
  Globe,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Download,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Reusable Stats Card Component
const StatsCard = ({ title, icon: Icon, value, change }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <Icon className="w-4 h-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-green-500">{change}</div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New document uploaded", time: "5m ago", read: false, type: "info" },
    { id: 2, text: "User feedback received", time: "10m ago", read: false, type: "success" },
    { id: 3, text: "System update scheduled", time: "1h ago", read: true, type: "warning" },
  ]);

  const [languages] = useState(["English", "Spanish", "French", "German", "Chinese"]);
  const [selectedLang, setSelectedLang] = useState("English");

  const [documents, setDocuments] = useState([
    { id: 1, name: "Tax Form 2024", type: "PDF", date: "2024-03-28", status: "pending" },
    { id: 2, name: "Business License", type: "DOC", date: "2024-03-27", status: "approved" },
    { id: 3, name: "Permit Application", type: "PDF", date: "2024-03-26", status: "rejected" },
  ]);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    activeUsers: 12345,
    documentsProcessed: 45678,
    feedbackScore: 4.8,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10),
        documentsProcessed: prev.documentsProcessed + Math.floor(Math.random() * 5),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter documents by search term and status
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Handle document upload simulation
  const handleUpload = () => {
    if (!fileToUpload) return;

    setLoading(true);
    setTimeout(() => {
      const newDoc = {
        id: documents.length + 1,
        name: fileToUpload.name,
        type: fileToUpload.type === "application/pdf" ? "PDF" : "DOC",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      };
      setDocuments([newDoc, ...documents]);
      setShowUploadDialog(false);
      setLoading(false);
      addNotification("Document uploaded successfully");
    }, 1500);
  };

  // Add new notification
  const addNotification = (text) => {
    const newNotification = {
      id: notifications.length + 1,
      text,
      time: "Just now",
      read: false,
      type: "success",
    };
    setNotifications([newNotification, ...notifications]);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedbackRating === 0) return;
    setLoading(true);
    setTimeout(() => {
      addNotification("Thank you for your feedback!");
      setFeedbackText("");
      setFeedbackRating(0);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Government Services Dashboard</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Status: Operational
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 text-gray-700"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>

          <button
            className="p-2 rounded-full hover:bg-gray-100 relative"
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>

          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Active Users"
          icon={Users}
          value={stats.activeUsers.toLocaleString()}
          change="+2.5% from last hour"
        />
        <StatsCard
          title="Documents Processed"
          icon={FileText}
          value={stats.documentsProcessed.toLocaleString()}
          change="98.5% success rate"
        />
        <StatsCard
          title="Feedback Score"
          icon={MessageSquare}
          value={`${stats.feedbackScore}/5.0`}
          change="Based on 1,234 reviews"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document Management</CardTitle>
              <button
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>
            <CardDescription>Upload and manage documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full px-4 py-2 pl-10 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <select
                className="border rounded-lg px-4 py-2"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">Added {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        doc.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : doc.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications and Feedback Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() =>
                      setNotifications(notifications.map((n) => ({ ...n, read: true })))
                    }
                  >
                    Mark all as read
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      notif.read ? "bg-gray-50" : "bg-blue-50"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 mt-2 rounded-full ${
                        notif.type === "success"
                          ? "bg-green-500"
                          : notif.type === "warning"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{notif.text}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() =>
                          setNotifications(
                            notifications.map((n) =>
                              n.id === notif.id ? { ...n, read: true } : n
                            )
                          )
                        }
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Feedback</CardTitle>
              <CardDescription>Help us improve our services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      rating <= feedbackRating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setFeedbackRating(rating)}
                  >
                    <Star className="w-6 h-6" />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full p-3 border rounded-lg mb-4"
                placeholder="Share your thoughts..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
              <button
                className={`w-full px-4 py-2 rounded-lg text-white transition-colors ${
                  loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleFeedbackSubmit}
                disabled={loading || feedbackRating === 0}
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Document Dialog */}
      {showUploadDialog && (
        <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Upload New Document</AlertDialogTitle>
              <AlertDialogDescription>
                Select a file to upload and submit it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFileToUpload(e.target.files[0])}
              className="mb-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUploadDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleUpload} disabled={!fileToUpload || loading}>
                {loading ? "Uploading..." : "Upload"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Dashboard;
