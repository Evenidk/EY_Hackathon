// digital-seva\app\components\SchemeList.tsx
import React from 'react';
import { Scheme } from '../types';

interface SchemeListProps {
  schemes: Scheme[] | undefined;
}

const SchemeList: React.FC<SchemeListProps> = ({ schemes = [] }) => {
  if (!schemes || schemes.length === 0) {
    return <p className="text-gray-500">No schemes available at the moment.</p>;
  }

  return (
    <div className="space-y-4">
      {schemes.map((scheme) => (
        <div key={scheme.id} className="p-4 border rounded shadow-sm">
          <h3 className="text-lg font-semibold">{scheme.name}</h3>
          <p className="text-sm text-gray-500">{scheme.description}</p>
          
          <h4 className="font-semibold mt-2">Benefits:</h4>
          <ul className="list-disc list-inside text-gray-700">
            {scheme.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>

          <h4 className="font-semibold mt-2">Eligibility Criteria:</h4>
          <ul className="list-disc list-inside text-gray-700">
            {Object.entries(scheme.eligibilityCriteria).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default SchemeList;
