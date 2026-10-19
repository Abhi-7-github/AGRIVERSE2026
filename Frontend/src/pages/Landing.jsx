import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  CreditCard,
  ShieldCheck,
  Calendar,
  MapPin,
  Award,
  ArrowRight,
  MessageCircle,
  Lock,
  Sprout,
} from 'lucide-react';
import { useEvent } from '../context/EventContext';
import ProgressBar from '../components/ProgressBar';
import { checkRegistrationStatus } from '../api/client';

const Landing = () => {
  const navigate = useNavigate();
  const { eventData, refreshEvent } = useEvent();
  const [isVerifying, setIsVerifying] = useState(false);
  const [closedWarning, setClosedWarning] = useState('');

  const {
    registrationOpen = true,
    isFull = false,
    registrationLimit = 100,
    registeredTeams = 0,
    registrationFee = 350,
    whatsappGroups = [],
  } = eventData || {};

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setClosedWarning('');
    try {
      const statusRes = await checkRegistrationStatus();
      if (statusRes && statusRes.success) {
        if (!statusRes.isOpen) {
          setClosedWarning(statusRes.message || 'Registrations are currently unavailable.');
          refreshEvent();
          return;
        }
      }
      navigate('/agrigenevent/registerationforstudent');
    } catch (err) {
      console.error('Status check error:', err);
      navigate('/agrigenevent/registerationforstudent');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden text-slate-100">

      {/* Hero Section */}
      <div className="relative pt-6 pb-14 md:pt-10 md:pb-20 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">

          {/* Eyebrow Course Badge with KARE Tech Logo */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-[#6B9080]/30 text-[#6B9080] text-[11px] font-bold tracking-[0.16em] uppercase mb-6 shadow-md shadow-black/30 backdrop-blur-md">
            <img
              src="/assets/kare-tech-logo.png"
              alt="KARE Tech"
              className="w-5 h-5 rounded-full object-contain bg-black p-0.5"
            />
            <span>KARE Tech • AgriVerse 2026 • 2-Day Intensive Course</span>
          </div>

          {/* Hero Display Headline from ui.md: font-fraunces */}
          <h1 className="hero-title text-4xl sm:text-6xl lg:text-[4.75rem] font-bold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto mb-3 font-fraunces drop-shadow-md">
            Modern Agriculture
          </h1>

          {/* Hero Italic Subtitle from ui.md: font-cormorant italic */}
          <p className="hero-subtitle text-2xl sm:text-3xl md:text-4xl text-[#CCE3DE] font-medium italic leading-snug max-w-3xl mx-auto mb-6 font-cormorant drop-shadow-sm">
            Sustainable Practices, Innovations & Future Farming
          </p>

          {/* Narrative Body Text from ui.md */}
          <p className="hero-narrative text-sm sm:text-base md:text-lg text-[#EAF4F4]/90 max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
            AgriVerse brings together passionate minds to innovate, collaborate, and create a sustainable future through agri-genomics, smart agricultural technology, and future farming practices.
          </p>

          {/* Progress Bar Container Card (as seen in user screenshot) */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-white shadow-xl border border-slate-100 mb-6 text-left">
            <ProgressBar
              registeredTeams={registeredTeams}
              registrationLimit={registrationLimit}
              isOpen={registrationOpen}
              isFull={isFull}
            />
          </div>

          {/* Event Logistics Badges Grid (unified horizontal white card from user screenshot) */}
          <div className="max-w-4xl mx-auto mb-8 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 divide-y sm:divide-y-0 md:divide-x divide-slate-200">
              {/* Date */}
              <div className="md:px-4 first:pl-0">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#587B6C] font-sans">
                  <span>📅</span> DATE
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-serif">
                  31 Oct & 1 Nov 2026
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  2-Day Intensive
                </p>
              </div>

              {/* Venue */}
              <div className="pt-3 sm:pt-0 md:px-4">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#587B6C] font-sans">
                  <span>📍</span> VENUE
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-serif">
                  Admin Block
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Seminar Hall
                </p>
              </div>

              {/* Registration Fee */}
              <div className="pt-3 sm:pt-0 md:px-4">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#587B6C] font-sans">
                  <span>💰</span> REGISTRATION FEE
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-serif">
                  ₹{registrationFee || 350} per student
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Individual Entry
                </p>
              </div>

              {/* Accreditation */}
              <div className="pt-3 sm:pt-0 md:px-4 last:pr-0">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#587B6C] font-sans">
                  <span>🏆</span> ACCREDITATION
                </span>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1 font-serif">
                  1-Credit UE Course
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Certificate Included
                </p>
              </div>
            </div>
          </div>

          {/* Call To Action Button - Primary Solid Action Button from ui.md */}
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            {closedWarning && (
              <div className="mb-3 w-full p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold text-center">
                {closedWarning}
              </div>
            )}

            {registrationOpen && !isFull ? (
              <button
                type="button"
                onClick={handleRegisterClick}
                disabled={isVerifying}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-sans font-bold text-base transition-all shadow-xl shadow-[#6B9080]/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] border border-[#6B9080] cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <span>Register Now (₹{registrationFee || 350})</span>
                    <ArrowRight className="w-5 h-5 text-white stroke-[2.5]" />
                  </>
                )}
              </button>
            ) : isFull ? (
              <div className="w-full py-3.5 px-6 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                <Lock className="w-4 h-4" />
                <span>CAPACITY FULL (100% Slots Booked)</span>
              </div>
            ) : (
              <div className="w-full py-3.5 px-6 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Registrations Currently Closed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seamless 3-Step Registration Process Flow */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 relative z-10">
        <div className="text-center mb-10">
          <h2 className="section-title text-2xl sm:text-3xl font-black text-white font-fraunces">
            Seamless 3-Step Registration
          </h2>
          <p className="text-xs sm:text-sm text-[#CCE3DE] mt-1.5 font-sans">
            Submit your profile details, complete instant verification, and access exclusive elective privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#6B9080]/50 transition-all shadow-xl group text-left">
            <div className="w-10 h-10 rounded-xl bg-[#F4FBF7] text-[#587B6C] font-mono font-extrabold text-base flex items-center justify-center mb-4 border border-[#6B9080]/30 group-hover:bg-[#6B9080] group-hover:text-white transition-all">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 font-sans">Create Profile</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Submit your academic details, registration number, branch, and contact information safely into our verified registry.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#6B9080]/50 transition-all shadow-xl group text-left">
            <div className="w-10 h-10 rounded-xl bg-[#F4FBF7] text-[#587B6C] font-mono font-extrabold text-base flex items-center justify-center mb-4 border border-[#6B9080]/30 group-hover:bg-[#6B9080] group-hover:text-white transition-all">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 font-sans">UPI Payment & Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Scan the official event QR code, transfer registration fee via UPI, and submit your Transaction Reference ID (UTR).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#6B9080]/50 transition-all shadow-xl group text-left">
            <div className="w-10 h-10 rounded-xl bg-[#F4FBF7] text-[#587B6C] font-mono font-extrabold text-base flex items-center justify-center mb-4 border border-[#6B9080]/30 group-hover:bg-[#6B9080] group-hover:text-white transition-all">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5 font-sans">Confirmation & Channels</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Receive your confirmed AgriVerse 1-Credit elective registration passport and join peer research announcement groups.
            </p>
          </div>
        </div>

        {/* WhatsApp Community Card */}
        {whatsappGroups && whatsappGroups.length > 0 && (
          <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-base font-sans">Official AgriVerse WhatsApp Channels</h4>
                <p className="text-xs text-slate-600">Join verified announcement groups for course logistics and timetable alerts.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {whatsappGroups.map((group, idx) => (
                <a
                  key={idx}
                  href={group.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-md transition-colors"
                >
                  <span>{group.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
