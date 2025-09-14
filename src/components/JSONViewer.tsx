import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface JSONViewerProps {
  data: any;
  title?: string;
  maxHeight?: string;
}

export const JSONViewer: React.FC<JSONViewerProps> = ({ 
  data, 
  title = "JSON Data", 
  maxHeight = "max-h-60" 
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['root']));

  const toggleSection = (path: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const renderValue = (value: any, key: string, path: string, level: number = 0): React.ReactNode => {
    const isExpanded = expandedSections.has(path);
    const indent = '  '.repeat(level);

    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-600">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-orange-600">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="ml-2">
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
            onClick={() => toggleSection(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            <span className="text-purple-600">[</span>
            <span className="text-gray-500 ml-1">{value.length} items</span>
            <span className="text-purple-600">]</span>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-gray-200 pl-2">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">{index}:</span>
                  {renderValue(item, index.toString(), `${path}.${index}`, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return (
        <div className="ml-2">
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
            onClick={() => toggleSection(path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronRight className="h-3 w-3 mr-1" />
            )}
            <span className="text-blue-600">{'{'}</span>
            <span className="text-gray-500 ml-1">{keys.length} properties</span>
            <span className="text-blue-600">{'}'}</span>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-gray-200 pl-2">
              {keys.map((objKey) => (
                <div key={objKey} className="py-1">
                  <span className="text-red-600">"{objKey}":</span>
                  {renderValue(value[objKey], objKey, `${path}.${objKey}`, level + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span className="text-gray-500">{String(value)}</span>;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>
      
      <div className={`p-4 overflow-auto ${maxHeight}`}>
        <div className="font-mono text-xs">
          {renderValue(data, 'root', 'root')}
        </div>
      </div>
    </div>
  );
};
