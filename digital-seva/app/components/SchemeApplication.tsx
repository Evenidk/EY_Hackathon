// digital-seva\app\components\SchemeApplication.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Notification {
  id: number;
  message: string;
  isNew: boolean;
}

interface SchemeApplicationProps {
  scheme: any; // Replace 'any' with your Scheme interface
  onClose: () => void;
}

const SchemeApplication = ({ scheme, onClose }: SchemeApplicationProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const steps = ["Basic Information", "Document Upload", "Verification", "Submission"];

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, { id: Date.now(), message, isNew: true }]);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
    addNotification("Documents uploaded successfully");
  };

  const handleStepComplete = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
      addNotification(`Completed step ${activeStep + 1} of application`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Apply for {scheme.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${
                    index <= activeStep ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${index <= activeStep ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm mt-1">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {activeStep === 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              {/* Add your form fields here */}
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Document Upload</h3>
              <div className="space-y-2">
                {scheme.documents.map((doc: string) => (
                  <div key={doc} className="flex items-center gap-2">
                    <input type="file" className="flex-1" />
                    <span className="text-sm text-gray-600">{doc}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Upload Documents
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleStepComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={activeStep === steps.length - 1}
            >
              {activeStep === steps.length - 1 ? "Submit" : "Next"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemeApplication;