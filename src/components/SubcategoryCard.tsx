import React from 'react';
import { BookOpen } from 'lucide-react';
import { Subcategory } from '../types/api';

interface SubcategoryCardProps {
  subcategory: Subcategory;
  onClick: (subcategory: Subcategory) => void;
}

export const SubcategoryCard: React.FC<SubcategoryCardProps> = ({ subcategory, onClick }) => {
  return (
    <div
      onClick={() => onClick(subcategory)}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-100"
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {subcategory.name}
            </h3>
            <p className="text-sm text-gray-500">
              {subcategory.path.join(' > ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};