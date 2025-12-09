import React from 'react';

export const LoadingOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin reverse" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
      </div>
      <p className="text-white font-medium animate-pulse">Processing with Gemini 3 Pro...</p>
      <p className="text-white/60 text-sm mt-2">This may take a few moments</p>
    </div>
  );
};
