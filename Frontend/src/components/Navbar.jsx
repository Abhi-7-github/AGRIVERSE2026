import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  ShieldCheck,
  CreditCard,
  Sprout,
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show navbar near top of page
      if (currentScrollY < 20) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling downwards -> move navbar upwards (hide)
      if (currentScrollY > lastScrollY.current + 5) {
        setIsVisible(false);
      }
      // Scrolling upwards -> bring navbar back
      else if (currentScrollY < lastScrollY.current - 5) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;
  const shouldShow = isVisible || mobileMenuOpen;

  return (
    <header
      className={`fixed top-3 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 max-w-6xl mx-auto transition-all duration-300 ease-in-out ${shouldShow
          ? 'translate-y-0 opacity-100'
          : '-translate-y-28 opacity-0 pointer-events-none'
        }`}
    >
      <div className="bg-white/95 text-slate-900 border border-slate-200/90 rounded-xl shadow-lg px-4 sm:px-8 py-3 backdrop-blur-md transition-all duration-300">
        <div className="flex items-center justify-between">

          {/* Left: AgriVerse Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            {/* KARE Tech Brand Logo */}
            <div className="w-9 h-9 rounded-xl bg-black border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/assets/kare-tech-logo.png"
                alt="KARE Tech AgriVerse"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-xl tracking-tight font-fraunces">
                  Agri<span className="text-[#6B9080]">Verse</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#F4FBF7] text-[#2E4A3D] border border-[#6B9080]/30 font-mono">
                  2026
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wider hidden sm:block font-sans">
                KARE Tech • Modern Agriculture • UE Course
              </p>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
            {/* Home */}
            <Link
              to="/"
              className={`pb-1 transition-all ${isActive('/')
                  ? 'text-[#6B9080] font-bold border-b-2 border-[#6B9080]'
                  : 'text-slate-600 hover:text-slate-900 transition-colors'
                }`}
            >
              <span>Home</span>
            </Link>

            {/* Participant Payment */}
            <Link
              to="/team-payment"
              className={`pb-1 transition-all ${isActive('/team-payment')
                  ? 'text-[#6B9080] font-bold border-b-2 border-[#6B9080]'
                  : 'text-slate-600 hover:text-slate-900 transition-colors'
                }`}
            >
              <span>Participant Payment</span>
            </Link>

            {/* Check Status */}
            <Link
              to="/status"
              className={`pb-1 transition-all ${isActive('/status')
                  ? 'text-[#6B9080] font-bold border-b-2 border-[#6B9080]'
                  : 'text-slate-600 hover:text-slate-900 transition-colors'
                }`}
            >
              <span>Check Status</span>
            </Link>
          </div>

          {/* Right: Register Button on Desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/agrigenevent/registerationforstudent"
              className="px-4 py-2 rounded-lg bg-[#6B9080] hover:bg-[#587B6C] text-white text-xs font-bold font-sans transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#6B9080]/20 flex items-center gap-1.5"
            >
              <span>Register Now</span>
              <span className="text-white/90 font-mono font-bold">₹350</span>
            </Link>
          </div>

          {/* Right: Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 mt-3 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Home / Overview</span>
              <Home className="w-3.5 h-3.5 text-[#6B9080]" />
            </Link>
            <Link
              to="/agrigenevent/registerationforstudent"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-bold text-white bg-[#6B9080] flex items-center justify-between shadow-sm"
            >
              <span>Register (₹350)</span>
              <Sprout className="w-3.5 h-3.5 text-white" />
            </Link>
            <Link
              to="/team-payment"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Participant Payment</span>
              <CreditCard className="w-3.5 h-3.5 text-[#6B9080]" />
            </Link>
            <Link
              to="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>Check Registration Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B9080]" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
