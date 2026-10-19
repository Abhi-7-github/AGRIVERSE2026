import React, { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { AgriGenLeaf, IconPhone } from './AgrigenIcons';

const FloatingHelpButton = () => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <>
      {/* Floating Help Modal Popover */}
      {showHelpModal && (
        <div className="fixed bottom-16 right-4 sm:right-6 z-50 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-2xl text-slate-900 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F4FBF7] border border-[#6B9080]/30 flex items-center justify-center">
                <IconPhone className="w-4 h-4 text-[#6B9080]" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">Event Support</h4>
                <p className="text-[10px] text-slate-500 leading-tight">Need help? Contact Organizers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contact Cards */}
          <div className="space-y-2.5">
            {/* Jayanth */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Jayanth</span>
                  <span className="text-[9px] font-mono uppercase font-semibold text-[#2E4A3D] bg-[#F4FBF7] px-1.5 py-0.5 rounded border border-[#6B9080]/30">
                    WEB LEAD
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 mt-0.5">8869965959</div>
              </div>
              <a
                href="tel:8869965959"
                className="px-3 py-1.5 rounded-lg bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Call</span>
              </a>
            </div>

            {/* ABHIRAM */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>ABHIRAM</span>
                  <span className="text-[9px] font-mono uppercase font-semibold text-[#2E4A3D] bg-[#F4FBF7] px-1.5 py-0.5 rounded border border-[#6B9080]/30">
                    SECRETARY
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-600 mt-0.5">9398779899</div>
              </div>
              <a
                href="tel:9398779899"
                className="px-3 py-1.5 rounded-lg bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right Floating Leaf Button */}
      <div
        onClick={() => setShowHelpModal(!showHelpModal)}
        className="fixed bottom-4 right-4 z-50 group cursor-pointer"
        title="Need Help? Contact Organizers"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            showHelpModal
              ? 'bg-[#587B6C] text-white scale-110'
              : 'bg-[#6B9080] text-white group-hover:scale-110 shadow-[#6B9080]/40'
          }`}
        >
          {showHelpModal ? (
            <X className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <img
              src="/assets/kare-tech-logo.png"
              alt="AgriVerse"
              className="w-5 h-5 rounded-full object-contain"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingHelpButton;
