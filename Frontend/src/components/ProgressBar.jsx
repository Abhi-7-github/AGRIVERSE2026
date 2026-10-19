import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';

const ProgressBar = ({
  registeredTeams = 0,
  registrationLimit = 100,
  isOpen = true,
  isFull = false,
  showLabels = true,
  className = '',
}) => {
  const percent = Math.min(100, Math.round((registeredTeams / (registrationLimit || 1)) * 100));
  const remaining = Math.max(0, registrationLimit - registeredTeams);

  const remainingPercent = Math.max(0, 100 - percent);

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          {/* Header Title */}
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-sans tracking-tight">
            Live Seat Capacity Meter
          </h3>

          {/* Capacity Percentage Pill */}
          <div className="px-3 py-1 rounded-lg bg-[#F4FBF7] border border-[#6B9080]/30 text-slate-800 font-mono font-bold text-xs tracking-wider w-fit shadow-xs">
            {percent}% Booked
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full bg-[#E5EFEB] h-3 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-[#6B9080] h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.max(percent > 0 ? 3 : 0, percent)}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 text-xs">
          <span className="text-slate-500 font-medium font-sans">
            {remainingPercent}% remaining before capacity cutoff
          </span>

          <div>
            {!isOpen && !isFull ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-600">
                <Lock className="w-3 h-3 text-slate-500" /> REGISTRATIONS CLOSED
              </span>
            ) : isFull || percent >= 100 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700">
                <AlertCircle className="w-3 h-3 text-rose-600" /> CAPACITY FULL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#6B9080]/40 bg-[#F4FBF7] text-[#2E4A3D] tracking-wide">
                REGISTRATIONS OPEN
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
