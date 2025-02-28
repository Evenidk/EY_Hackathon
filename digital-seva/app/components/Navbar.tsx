"use client";

import { UserCircle, Menu, X, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/app/lib/TranslationContext";
import { useEffect, useState } from "react";

const Navbar = () => {
  const { t, setLanguage, language } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsLanguageDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-md p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Title */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 hover:text-gray-900 transition">
              {t("headerTitle")}
            </h1>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-700" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <div className="relative">
            <button
              onClick={toggleLanguageDropdown}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <Globe className="w-6 h-6" />
              <span>{t("language")}</span>
            </button>
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("english")}
                >
                  English
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("hindi")}
                >
                  हिंदी
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("bengali")}
                >
                  বাংলা
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("marathi")}
                >
                  मराठी
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("tamil")}
                >
                  தமிழ்
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("telugu")}
                >
                  తెలుగు
                </button>
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              {t("logout")}
            </button>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                {t("login")}
              </Link>
              <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                {t("register")}
              </Link>
            </>
          )}

          {isLoggedIn && (
            <Link href="/profile">
              <UserCircle className="w-8 h-8 text-gray-700 hover:text-gray-900 transition" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 p-4 bg-white shadow-md rounded-md">
          <div className="relative">
            <button
              onClick={toggleLanguageDropdown}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <Globe className="w-6 h-6" />
              <span>{t("language")}</span>
            </button>
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("english")}
                >
                  English
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("hindi")}
                >
                  हिंदी
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("bengali")}
                >
                  বাংলা
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("marathi")}
                >
                  मराठी
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("tamil")}
                >
                  தமிழ்
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => handleLanguageChange("telugu")}
                >
                  తెలుగు
                </button>
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              {t("logout")}
            </button>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                {t("login")}
              </Link>
              <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                {t("register")}
              </Link>
            </>
          )}

          {isLoggedIn && (
            <Link href="/profile" className="flex justify-center">
              <UserCircle className="w-8 h-8 text-gray-700 hover:text-gray-900 transition" />
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;