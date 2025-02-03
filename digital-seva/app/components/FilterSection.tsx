// digital-seva\app\components\FilterSection.tsx
import { useState } from 'react';

interface FilterSectionProps {
  onFilter: (selectedCategories: string[]) => void;
}

export default function FilterSection({ onFilter }: FilterSectionProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleFilterChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const applyFilter = () => {
    onFilter(selectedCategories);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
      <div className="space-y-2">
        {["health", "education", "financial", "housing"].map((category) => (
          <label key={category} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => handleFilterChange(category)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </label>
        ))}
      </div>
      <button
        onClick={applyFilter}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Apply Filter
      </button>
    </div>
  );
}
