import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading resources...' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div
        className={`${sizes[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin`}
      />
      {text && <p className="text-xs text-slate-500 font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
