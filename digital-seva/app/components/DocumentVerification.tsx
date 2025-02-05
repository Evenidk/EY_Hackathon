// components/DocumentVerification.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";

// Simplified VerificationResult interface
interface VerificationResult {
  isValid: boolean;
  confidenceScore: number;
  documentType: string;
  errors?: string[];
}

interface Document {
  type: string;
  file: File | null;
  status: 'pending' | 'verifying' | 'verified' | 'failed';
  result?: VerificationResult;
}

const DOCUMENT_TYPES = [
  'Aadhar Card',
  'PAN Card',
  'Caste Certificate',
  'Ration Card',
  'Voter ID',
  'Driving License',
  'Income Certificate',
  'Disability Certificate',
  'Birth Certificate',
  'Marriage Certificate',
  'Bank Passbook',
  'Employment Certificate',
  'Educational Certificates',
  'Property Documents'
];

export function DocumentVerification() {
  // Add mounted state to handle hydration
  const [isMounted, setIsMounted] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(
    DOCUMENT_TYPES.map(type => ({
      type,
      file: null,
      status: 'pending'
    }))
  );

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileUpload = async (type: string, file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size should be less than 10MB');
      }
  
      setDocuments(prev => prev.map(doc => 
        doc.type === type 
          ? { ...doc, file, status: 'verifying' }
          : doc
      ));
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', type);
  
      const response = await fetch('http://localhost:5000/verify', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }
  
      // Transform the result to match our simplified interface
      const transformedResult: VerificationResult = {
        isValid: result.isValid,
        confidenceScore: result.confidenceScore || 0,
        documentType: result.documentType,
        errors: result.errors || []
      };
  
      setDocuments(prev => prev.map(doc => 
        doc.type === type 
          ? { 
              ...doc, 
              status: transformedResult.isValid ? 'verified' : 'failed',
              result: transformedResult
            }
          : doc
      ));
    } catch (error: unknown) {
      console.error('Verification error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
  
      setDocuments(prev => prev.map(doc => 
        doc.type === type 
          ? { 
              ...doc, 
              status: 'failed',
              result: { 
                isValid: false, 
                confidenceScore: 0,
                documentType: type,
                errors: [errorMessage]
              }
            }
          : doc
      ));
    }
  };

  // Don't render until client-side hydration is complete
  if (!isMounted) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Document Verification</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.type}>
            <CardHeader>
              <CardTitle>{doc.type}</CardTitle>
              <CardDescription>
                {doc.status === 'pending' && 'Upload document for verification'}
                {doc.status === 'verifying' && 'Verifying...'}
                {doc.status === 'verified' && 'Document verified'}
                {doc.status === 'failed' && 'Verification failed'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        alert('Please upload only PDF files');
                        e.target.value = '';
                        return;
                      }
                      handleFileUpload(doc.type, file);
                    }
                  }}
                  className="hidden"
                  id={`file-${doc.type}`}
                />
                <Button
                  onClick={() => document.getElementById(`file-${doc.type}`)?.click()}
                  disabled={doc.status === 'verifying'}
                  variant={doc.status === 'verified' ? 'outline' : 'default'}
                >
                  {doc.file ? 'Replace Document' : 'Upload Document'}
                </Button>

                {doc.status === 'verifying' && (
                  <div className="space-y-2">
                    <Progress value={45} className="w-full" />
                    <p className="text-sm text-gray-500">Processing document...</p>
                  </div>
                )}

                {doc.result && isMounted && (
                  <div className="text-sm space-y-2">
                    <p className={`font-medium ${doc.result.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {doc.result.isValid ? 'Verification Successful' : 'Verification Failed'}
                    </p>
                    <p>Confidence: {Math.round(doc.result.confidenceScore * 100)}%</p>
                    
                    {doc.result.errors && doc.result.errors.length > 0 && (
                      <div className="bg-red-50 p-2 rounded">
                        {doc.result.errors.map((error: string, index: number) => (
                          <p key={index} className="text-red-600 text-xs">{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}