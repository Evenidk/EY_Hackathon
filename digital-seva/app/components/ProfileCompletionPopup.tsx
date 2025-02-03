// components/ProfileCompletionPopup.tsx
import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

interface ProfileCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  completionPercentage: number;
  missingFields: string[];
}

export const ProfileCompletionPopup = ({
  isOpen,
  onClose,
  completionPercentage,
  missingFields
}: ProfileCompletionPopupProps) => {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {missingFields.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Missing Information:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="text-gray-600">
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Complete Profile
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};