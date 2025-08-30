import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Category } from '../types/api';

interface CategoryCardProps {
  category: Category;
  onClick: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <div
      onClick={() => onClick(category)}
      className="bg-yellow-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border border-blue-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {category.name}
            </h3>
            <p className="text-sm text-blue-600">
              Explore {category.name} subjects
            </p>
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 bg-blue-800 rounded-full flex items-center justify-center">
              <ChevronRight className="w-6 h-6 text-yellow-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};