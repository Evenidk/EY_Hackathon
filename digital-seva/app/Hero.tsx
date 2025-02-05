// digital-seva\app\Hero.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  UserCircle,
  Bell,
  HelpCircle,
  Layout,
  ArrowRight,
  Loader,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "./lib/TranslationContext";
import Navbar from "./components/Navbar";
import { ProfileCompletionPopup } from "./components/ProfileCompletionPopup";
import { useProfileCompletion } from "./hooks/useProfileCompletion";
import { AIAssistant } from "./components/AIAssistant";
import { useUser } from "./hooks/useUser";

// Define interfaces for type safety
interface Notification {
  id: string;
  message: string;
  isNew: boolean;
}

interface UserProfile {
  income: number;
  location: string;
  familySize: number;
  name?: string;
  age?: number;
  sex?: string;
  maritalStatus?: string;
  documents?: string[];
}

const CitizenServices = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    income: 0,
    location: "",
    familySize: 0,
  });
  const { user, loading } = useUser();
  const { t } = useTranslation();

  // Quick Links data
  const quickLinks = [
    {
      title: t("findSchemes"),
      description: t("findSchemesDesc"),
      icon: <Layout className="h-7 w-7" />,
      href: "/schemes",
      color: "bg-blue-500",
    },
    {
      title: t("Document Management System"),
      description: t("AI-driven document verification & management"),
      icon: <FileText className="h-7 w-7" />,
      href: "/Document_Management_System",
      color: "bg-green-500",
    },
    {
      title: t("Nithya"),
      description: t("Your AI Government Scheme Assistant"),
      icon: <Bot className="h-7 w-7" />,
      href: "/Nithya",
      color: "bg-purple-500",
    },
  ];

  // Load user profile from localStorage and API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // First try to get from localStorage
        const savedProfile = localStorage.getItem("userProfile");
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setUserProfile(parsed);
        }

        // Then fetch from API to get latest data
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
          // Update localStorage with latest data
          localStorage.setItem("userProfile", JSON.stringify(profileData));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Save user profile to localStorage
  useEffect(() => {
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  // Sample notifications data
  useEffect(() => {
    // Simulate fetching notifications
    const sampleNotifications: Notification[] = [
      {
        id: "1",
        message: "New scheme available in your area",
        isNew: true,
      },
      {
        id: "2",
        message: "Your profile is 70% complete",
        isNew: false,
      },
    ];
    setNotifications(sampleNotifications);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />

      <main className="mx-auto p-8 ">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-6 text-[#1F2937]">
            {t("headerTitle")}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t("accessMessage")}
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {quickLinks.map((link, index) => (
            <Link href={link.href} key={index}>
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full border border-gray-200 rounded-lg">
                <CardContent className="p-6">
                  <div
                    className={`${link.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-6`}
                  >
                    {link.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1F2937]">
                    {link.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{link.description}</p>
                  <div className="flex items-center text-blue-600 font-medium">
                    {t("learnMore")} <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI Assistant Card */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <AIAssistant user={user || {}} />
        )}

        {/* Recent Updates Section */}
        <Link href="/schemes">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-[#1F2937]">
                {t("recentUpdates")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {t("newSchemeAnnounced")}
                    </h4>
                    <p className="text-gray-600">{t("newSchemeDesc")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>

      {/* Notification Button */}
      <button
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed right-4 bottom-16 bg-white rounded-lg shadow-xl w-80 p-4 border border-gray-200">
          <h3 className="font-bold mb-4 text-[#1F2937]">
            {t("notifications.title")}
          </h3>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif.id} className="p-2 border-b border-gray-200">
                <p className="text-sm text-gray-700">{notif.message}</p>
                {notif.isNew && (
                  <span className="text-xs text-blue-500">
                    {t("notifications.new")}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm">{t("notifications.empty")}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CitizenServices;
