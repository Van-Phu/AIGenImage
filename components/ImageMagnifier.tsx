import React, { useState, MouseEvent } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  className?: string;
  zoomLevel?: number;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({ 
  src, 
  alt = '', 
  className = '', 
  zoomLevel = 5 // Updated default to 5x as requested
}) => {
  const [zoomable, setZoomable] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Size of the magnifier lens
  const magnifierSize = 150;

  const handleMouseEnter = () => {
    setShowMagnifier(true);
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const elem = e.currentTarget;
    const { top, left, width, height } = elem.getBoundingClientRect();

    // Calculate cursor position relative to the image container
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;
    
    setCursorPosition({ x, y });

    // Calculate percentage position for background
    let bgX = (x / width) * 100;
    let bgY = (y / height) * 100;

    // Clamp values
    if (bgX > 100) bgX = 100;
    if (bgX < 0) bgX = 0;
    if (bgY > 100) bgY = 100;
    if (bgY < 0) bgY = 0;

    setPosition({ x: bgX, y: bgY });
  };

  return (
    <div 
      className={`relative inline-block overflow-hidden cursor-crosshair ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-contain" 
      />

      {/* Magnifier Glass */}
      {showMagnifier && (
        <div
          style={{
            position: "absolute",
            left: `${cursorPosition.x - magnifierSize / 2}px`,
            top: `${cursorPosition.y - magnifierSize / 2}px`,
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            border: "2px solid white",
            borderRadius: "50%",
            backgroundColor: "white",
            backgroundImage: `url('${src}')`,
            backgroundRepeat: "no-repeat",
            // Use backgroundSize to control zoom level relative to the container
            backgroundSize: `${zoomLevel * 100}%`, 
            backgroundPosition: `${position.x}% ${position.y}%`,
            pointerEvents: "none",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            zIndex: 50
          }}
        />
      )}
    </div>
  );
};