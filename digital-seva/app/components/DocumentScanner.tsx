// digital-seva\app\components\DocumentScanner.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';  // For redirection
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";


interface ScannedDocument {
  id: string;
  file: File;
  preview: string;
  status: 'scanning' | 'complete' | 'error';
  timestamp: Date;
  name: string;
}

interface DocumentScannerProps {
  onAddDocument?: (newDocument: ScannedDocument) => void;  // Add an optional prop to handle scanned documents externally
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onAddDocument }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter(); // For redirection

  // Start camera when the modal opens and stop when it closes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera(); // Cleanup when component unmounts
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          await processScannedDocument(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const processScannedDocument = async (blob: Blob) => {
    setIsScanning(true);
    const timestamp = new Date();
    const file = new File([blob], `scan-${timestamp.getTime()}.jpg`, { type: 'image/jpeg' });

    try {
      const preview = URL.createObjectURL(blob);
      const newDocument: ScannedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        status: 'scanning',
        timestamp,
        name: timestamp.toLocaleString(),  // Default name as date:time
      };

      // Add document to state
      const updatedDocuments = [...documents, newDocument];
      setDocuments(updatedDocuments);

      // Save scanned documents to localStorage
      localStorage.setItem('scannedDocuments', JSON.stringify(updatedDocuments));

      // Simulate delay for document processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark document status as complete
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === newDocument.id ? { ...doc, status: 'complete' } : doc
        )
      );

      // If onAddDocument prop is passed, use it to add the new document externally
      if (onAddDocument) {
        onAddDocument(newDocument);
      } else {
        // Redirect to the document list page after scanning (default behavior)
        router.push('/scanned-documents');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processScannedDocument(file);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle>AI Document Scanner</CardTitle>
          <CardDescription className="text-blue-100">
            Scan and verify documents instantly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg w-full justify-center hover:bg-blue-50 transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <Camera className="h-5 w-5" />
            <span>Scan Documents</span>
          </button>

          <button
            className="flex items-center space-x-2 bg-blue-400 text-white px-4 py-2 rounded-lg w-full justify-center hover:bg-blue-300 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-5 w-5" />
            <span>Upload Documents</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Scan Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              <button
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-blue-600 px-6 py-2 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                onClick={captureImage}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Scanned Documents Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="relative group">
                  <img
                    src={doc.preview}
                    alt="Scanned document"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />

                  {doc.status === 'scanning' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}

                  {doc.status === 'complete' && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 text-white p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentScanner;
