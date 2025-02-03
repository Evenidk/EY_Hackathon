// digital-seva\app\components\SchemeFinder.tsx
"use client";

import { useState } from 'react';
import UserForm from './UserForm';
import SchemeList from './SchemeList';
import FilterSection from './FilterSection';
import { UserProfile, Scheme } from '../types';

export default function SchemeFinder() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);

  const handleSubmit = async (userProfile: UserProfile) => {
    try {
      const response = await fetch('/api/schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });
      const data = await response.json();
      setSchemes(data.schemes);
      setFilteredSchemes(data.schemes);
    } catch (error) {
      alert('Failed to fetch schemes');  // Replace with ShadCN alert if needed
    }
  };

  const handleFilter = (categories: string[]) => {
    setFilteredSchemes(
      categories.length === 0 ? schemes : schemes.filter((scheme) => categories.includes(scheme.category))
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Government Scheme Finder</h1>
      <UserForm onSubmit={handleSubmit} />
      <FilterSection onFilter={handleFilter} />
      <SchemeList schemes={filteredSchemes} />
    </div>
  );
}
