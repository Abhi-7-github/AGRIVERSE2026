import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { getMediaUrl } from '../api/client';

const ImageViewerModal = ({ isOpen, imageUrl, title = 'Payment Screenshot Proof', onClose }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !imageUrl) return null;

  // Format image URL dynamically
  const resolvedUrl = getMediaUrl(imageUrl);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-200 transition-colors ml-1"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 min-h-[300px]">
          <img
            src={resolvedUrl}
            alt="Payment Screenshot Proof"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[70vh] object-contain rounded-xl transition-transform duration-200 cursor-zoom-in border border-slate-200 shadow-sm"
            onClick={handleZoomIn}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span className="text-center sm:text-left">Pinch or click image / zoom controls to inspect details</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
