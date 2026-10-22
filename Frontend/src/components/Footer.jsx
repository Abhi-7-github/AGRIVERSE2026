import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';

const Footer = () => {
  const location = useLocation();

  // Hide footer on full-screen registration page
  if (location.pathname === '/agrigenevent/registerationforstudent' || location.pathname === '/register') {
    return null;
  }

  return (
    <footer className="w-full bg-white text-slate-900 border-t border-slate-200 py-6 px-4 sm:px-8 mt-16 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">

        {/* Brand Title with KARE Tech Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-sm">
            <img
              src="/assets/kare-tech-logo.png"
              alt="KARE Tech AgriVerse"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <span className="font-extrabold text-slate-900 text-base tracking-tight font-fraunces">
            AGRI<span className="text-[#6B9080]">VERSE</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500 text-[11px] font-sans">
            KARE Tech • Modern Agriculture • 2-Day UE Elective Course
          </span>
        </div>

        {/* Organizing Committee Leads */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-[11px] font-mono text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider font-sans">Jayanth</span>
            <span className="bg-[#F4FBF7] text-[#2E4A3D] border border-[#6B9080]/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">(WEB LEAD)</span>
            <a href="tel:8869965959" className="text-slate-900 hover:text-[#6B9080] transition-colors font-bold underline decoration-dotted">
              8869965959
            </a>
          </div>

          <div className="hidden sm:block w-px h-4 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider font-sans">Abhiram</span>
            <span className="bg-[#F4FBF7] text-[#2E4A3D] border border-[#6B9080]/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">(SECRETARY)</span>
            <a href="tel:9398779899" className="text-slate-900 hover:text-[#6B9080] transition-colors font-bold underline decoration-dotted">
              9398779899
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-slate-400 text-[10px] font-sans text-center md:text-right">
          © {new Date().getFullYear()} AgriVerse Organizing Committee. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
