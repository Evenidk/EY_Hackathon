// digital-seva\app\profile\page.tsx
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useTranslation } from "@/app/lib/TranslationContext";
interface User {
  _id: string;
  name: string;
  age: number;
  phoneNumber: string;
  sex: string;
  email: string;
  maritalStatus?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  annualIncome?: number;
  location?: string;
  familySize?: number;
  residenceType?: string;
  category?: string;
  isDifferentlyAbled?: boolean;
  disabilityPercentage?: number;
  isMinority?: boolean;
  isStudent?: boolean;
  employmentStatus?: string;
  isGovernmentEmployee?: boolean;
}

interface Document {
  _id: string;
  documentType: string;
  filePath: string;
  isVerified: boolean;
  uploadedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    maritalStatus: "",
    address: "",
    fatherName: "",
    motherName: "",
    annualIncome: "",
    location: "",
    familySize: "",
    residenceType: "",
    category: "",
    isDifferentlyAbled: false,
    disabilityPercentage: "",
    isMinority: false,
    isStudent: false,
    employmentStatus: "",
    isGovernmentEmployee: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:3000/api/auth/profile", {
      headers: {
        "x-auth-token": token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        // Update form data with existing values
        setFormData({
          maritalStatus: data.maritalStatus || "",
          address: data.address || "",
          fatherName: data.fatherName || "",
          motherName: data.motherName || "",
          annualIncome: data.annualIncome?.toString() || "",
          location: data.location || "",
          familySize: data.familySize?.toString() || "",
          residenceType: data.residenceType || "",
          category: data.category || "",
          isDifferentlyAbled: data.isDifferentlyAbled || false,
          disabilityPercentage: data.disabilityPercentage?.toString() || "",
          isMinority: data.isMinority || false,
          isStudent: data.isStudent || false,
          employmentStatus: data.employmentStatus || "",
          isGovernmentEmployee: data.isGovernmentEmployee || false,
        });
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      });

    // Fetch documents
    fetch("http://localhost:3000/api/documents/my-documents", {
      headers: {
        "x-auth-token": token,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    try {
      const updateData = {
        ...formData,
        annualIncome: formData.annualIncome
          ? Number(formData.annualIncome)
          : undefined,
        familySize: formData.familySize
          ? Number(formData.familySize)
          : undefined,
        disabilityPercentage: formData.disabilityPercentage
          ? Number(formData.disabilityPercentage)
          : undefined,
      };

      const response = await fetch("http://localhost:3000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token!,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        const data = await response.json();
        throw new Error(data.msg || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    if (!e.target.files?.[0]) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("document", e.target.files[0]);
    formData.append("documentType", documentType);

    try {
      const response = await fetch(
        "http://localhost:3000/api/documents/upload",
        {
          method: "POST",
          headers: {
            "x-auth-token": token!,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments((prev) => [...prev, data.document]);
        alert("Document uploaded successfully!");
      } else {
        const data = await response.json();
        throw new Error(data.msg || "Failed to upload document");
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      alert(err instanceof Error ? err.message : "Failed to upload document");
    }
  };

  if (loading)
    return <div className="text-center mt-8">Loading profile...</div>;
  if (error)
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!user) return <div className="text-center mt-8">No user data found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
    <Navbar />
    {/* Back Button */}
    <div className="container mx-auto px-4 mb-12 mt-4">
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
        {t("backtohome")}
      </button>
    </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-blue-600">
                  {user.name[0]}
                </span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-blue-100">{t("email")}: {user.email}</p>
              </div>
            </div>
          </div>

          {/* Basic Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-500">{t("phoneNumber")}</label>
              <p className="text-lg font-medium">{user.phoneNumber}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-500">{t("age")}</label>
              <p className="text-lg font-medium">{user.age} years</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm text-gray-500">{t("gender")}</label>
              <p className="text-lg font-medium">{user.sex}</p>
            </div>
          </div>
        </div>

        {/* Profile Update Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t("Personalinfo")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("MaritalStatus")}
                </label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("SelectStatus")}</option>
                  <option value="Single">{t("single")}</option>
                  <option value="Married">{t("married")}</option>
                  <option value="Divorced">{t("divorced")}</option>
                  <option value="Widowed">{t("widowed")}</option>
                </select>
              </div>

              {/* Other form fields */}
              {Object.entries(formData)
                .filter(([key]) => key !== "maritalStatus")
                .map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      type={
                        key.includes("Income") || key.includes("Size")
                          ? "number"
                          : "text"
                      }
                      name={key}
                      value={value === true || value === false ? String(value) : value}
                      onChange={handleChange}
                      className="mt-1 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
            </div>

            {/* Residence Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("residencetype")}
              </label>
              <select
                name="residenceType"
                value={formData.residenceType}
                onChange={handleChange}
                className="mt-1 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("selecttype")}</option>
                <option value="Urban">{t("urban")}</option>
                <option value="Rural">{t("rural")}</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("category")}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("selectcategory")}</option>
                <option value="General">{t("general")}</option>
                <option value="OBC">{t("OtherBackwardClass")}</option>
                <option value="PVTG">
                  {t("ScheduledCaste")}
                </option>
                <option value="SC">{t("ScheduledCaste")}</option>
                <option value="ST">{t("ScheduledTribe")}</option>
              </select>
            </div>

            {/* Differently Abled */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isDifferentlyAbled"
                  checked={formData.isDifferentlyAbled}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("DifferentlyAbled")}
                </span>
              </label>

              {formData.isDifferentlyAbled && (
                <input
                  type="number"
                  name="disabilityPercentage"
                  value={formData.disabilityPercentage}
                  onChange={handleChange}
                  placeholder="Disability Percentage"
                  min="0"
                  max="100"
                  className="mt-2 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Minority Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isMinority"
                  checked={formData.isMinority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isMinority: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("Minority")}
                </span>
              </label>
            </div>

            {/* Student Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isStudent"
                  checked={formData.isStudent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isStudent: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t("Student")}
                </span>
              </label>
            </div>

            {/* Employment Status */}
            {!formData.isStudent && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("employmentStatus")}
                </label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("SelectStatus")}</option>
                  <option value="Employed">{t("Employed")}</option>
                  <option value="Unemployed">{t("Unemployed")}</option>
                  <option value="Self-Employed/ Entrepreneur">
                    {t("SelfEmployedEntrepreneur")}
                  </option>
                </select>
              </div>
            )}

            {/* Government Employee */}
            {formData.employmentStatus === "Employed" && (
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isGovernmentEmployee"
                    checked={formData.isGovernmentEmployee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isGovernmentEmployee: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                   {t("GovernmentEmployee")}
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={handleUpdate}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors"
            >
              {t("updateprofile")}
            </button>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">


            <div className="space-y-4">
              {[
                t("aadhar"),
                t("pancard"),
                t("castecertificate"),
                t("rationcard"),
                t("votercard"),
                t("drivinglicense"),
                t("incomecertificate"),
                t("birthcertificate"),
                t("marraigecertificate"),
              ].map((docType) => {
                const existingDoc = documents.find(
                  (doc) => doc.documentType === docType
                );
                return (
                  <div
                    key={docType}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-medium text-gray-700">
                        {docType}
                      </label>
                      {existingDoc && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            existingDoc.isVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {existingDoc.isVerified ? t("verified") : t("pending")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, docType)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {existingDoc && (
                        <a
                          href={`http://localhost:3000/${existingDoc.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-blue-600 hover:text-blue-700"
                        >
                          {t("view")}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
