// digital-seva\app\Document_Management_System\page.tsx
"use client";
import { DocumentVerification } from "../components/DocumentVerification";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Back Button */}
      <div className="container mx-auto px-4 mt-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </button>
      </div>
      <div className="p-4">
      <DocumentVerification />
      </div>
    </div>
  );
}
