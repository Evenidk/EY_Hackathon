// digital-seva\app\components\Navbar.tsx
"use client";

import { UserCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/app/lib/TranslationContext"; // Use the TranslationContext
import { useEffect, useState } from "react";

const Navbar = () => {
  const { t, setLanguage, language } = useTranslation(); // Get the translation hook
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if the user is logged in based on the presence of a token in localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token); // If token exists, user is logged in
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token on logout
    setIsLoggedIn(false); // Update state to reflect logged out status
  };

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Title */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-3xl font-semibold text-gray-800 hover:text-gray-900 transition">
              {t("headerTitle")}
            </h1>
          </Link>
        </div>

        {/* Right side elements */}
        <div className="flex gap-6 items-center">
          {/* Language Selector */}
          <select
            className="bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="english">English</option>
            <option value="hindi">हिंदी</option>
            <option value="bengali">বাংলা</option>
            <option value="marathi">मराठी</option>
            <option value="tamil">தமிழ்</option>
            <option value="telugu">తెలుగు</option>
          </select>

          {/* User Authentication buttons */}
          {isLoggedIn ? (
            // Show Logout button if the user is logged in
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          ) : (
            // Show Login and Register buttons if the user is not logged in
            <>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Register
              </Link>
            </>
          )}

          {/* User Icon (visible when logged in) */}
          {isLoggedIn && (
            <Link href="/profile">
              <UserCircle className="w-8 h-8 text-gray-700 hover:text-gray-900 transition" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
