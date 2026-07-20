import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react';

export default function ImageCropModal({ isOpen, imageSrc, onClose, onCropComplete }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  if (!isOpen || !imageSrc) return null;

  // Handle Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for Mobile support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleApplyCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const imgElement = imgRef.current;

    if (!imgElement) return;

    // View size in container
    const viewSize = 256;

    // Clear Canvas
    ctx.clearRect(0, 0, viewSize, viewSize);

    // Apply Canvas transforms to match the CSS transform
    ctx.save();
    
    // Move to center of canvas
    ctx.translate(128, 128);
    
    // Apply user translations and zoom
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Determine scale matching the CSS 'cover' logic
    const imgWidth = imgElement.naturalWidth;
    const imgHeight = imgElement.naturalHeight;
    
    let drawWidth, drawHeight;
    if (imgWidth > imgHeight) {
      drawHeight = viewSize;
      drawWidth = (imgWidth / imgHeight) * viewSize;
    } else {
      drawWidth = viewSize;
      drawHeight = (imgHeight / imgWidth) * viewSize;
    }

    // Draw the image centered
    ctx.drawImage(
      imgElement,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Export as JPEG DataURL
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 select-none glassmorphism flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-neutral-800 pb-3 mb-5">
          <h3 className="text-md font-bold text-white font-outfit">Crop Profile Photo</h3>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-850 rounded-full cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions */}
        <p className="text-[11px] text-neutral-400 text-center mb-4">
          Drag to reposition and use the slider to adjust zoom to fit in the 1:1 circle.
        </p>

        {/* Cropper Box */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative w-64 h-64 rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 cursor-move flex items-center justify-center shadow-inner"
        >
          {/* Cropping image */}
          <img 
            ref={imgRef}
            src={imageSrc} 
            alt="Source" 
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="pointer-events-none select-none max-w-none max-h-none"
            onLoad={() => {
              // Reset offset
              setOffset({ x: 0, y: 0 });
              setZoom(1);
            }}
          />

          {/* 1:1 Circle Highlight Overlay */}
          <div className="absolute inset-0 border-[32px] border-black/60 pointer-events-none flex items-center justify-center">
            <div className="w-[192px] h-[192px] rounded-full border border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.2)]"></div>
          </div>

          <div className="absolute bottom-2 right-2 bg-black/60 p-1 rounded backdrop-blur-sm pointer-events-none">
            <Move size={12} className="text-white animate-pulse" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="w-full flex items-center gap-3 mt-5 px-2">
          <ZoomOut size={14} className="text-neutral-400" />
          <input 
            type="range" 
            min="1" 
            max="3" 
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-spotify-green cursor-pointer h-1.5"
          />
          <ZoomIn size={14} className="text-neutral-400" />
        </div>

        {/* Zoom Value indicator */}
        <span className="text-[10px] text-neutral-500 font-bold mt-1.5 font-mono">
          {Math.round(zoom * 100)}% Zoom
        </span>

        {/* Action Buttons */}
        <div className="w-full flex gap-3 mt-6 border-t border-neutral-800 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-transparent hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs font-semibold transition cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCrop}
            className="flex-1 py-2 bg-spotify-green hover:bg-spotify-green-hover text-black rounded-full text-xs font-extrabold transition cursor-pointer text-center flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98"
          >
            <Check size={14} />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
