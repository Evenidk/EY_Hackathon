// digital-seva\app\components\UserForm.tsx
import { useState } from 'react';
import { UserProfile } from '../types';

interface UserFormProps {
  onSubmit: (data: UserProfile) => void;
}

export default function UserForm({ onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState<UserProfile>({
    age: 0,
    income: 0,
    occupation: '',
    location: '',
    priorities: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
      <div>
        <label className="block text-sm font-medium">Age</label>
        <input
          type="number"
          className="w-full mt-1 p-2 border rounded"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Annual Income</label>
        <input
          type="number"
          className="w-full mt-1 p-2 border rounded"
          value={formData.income}
          onChange={(e) => setFormData({ ...formData, income: parseInt(e.target.value) })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Occupation</label>
        <select
          className="w-full mt-1 p-2 border rounded"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
        >
          <option value="" disabled>Select occupation</option>
          <option value="student">Student</option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-employed</option>
          <option value="unemployed">Unemployed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Location</label>
        <input
          className="w-full mt-1 p-2 border rounded"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Priorities</label>
        <div className="flex gap-2">
          {['health', 'education', 'financial', 'housing'].map((priority) => (
            <label key={priority} className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                value={priority}
                checked={formData.priorities.includes(priority)}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    priorities: e.target.checked
                      ? [...prev.priorities, priority]
                      : prev.priorities.filter((p) => p !== priority),
                  }));
                }}
              />
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Find Schemes
      </button>
    </form>
  );
}
