import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Users2,
  Clock,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Search,
  ExternalLink,
  Award,
  Sprout,
} from 'lucide-react';
import { getRegistrationStatus } from '../api/client';

const Success = () => {
  const { registrationId } = useParams();
  const location = useLocation();

  const [registration, setRegistration] = useState(location.state?.registration || null);
  const [whatsappGroups, setWhatsappGroups] = useState(location.state?.whatsappGroups || []);
  const [loading, setLoading] = useState(!location.state?.registration);

  useEffect(() => {
    if (!registration && registrationId) {
      getRegistrationStatus(registrationId)
        .then((res) => {
          if (res.success) {
            setRegistration(res.registration);
            setWhatsappGroups(res.whatsappGroups || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [registration, registrationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Badge Banner */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#6B9080] text-xs font-bold mb-2 border border-[#6B9080]/30 shadow-sm">
          <img
            src="/assets/kare-tech-logo.png"
            alt="KARE Tech"
            className="w-4 h-4 rounded-full object-contain bg-black p-0.5"
          />
          <span>AgriVerse 2026 Passport</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-fraunces">
          Registration Submitted!
        </h1>
        {/* Subtitle */}
        <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-md mx-auto">
          {String(registration?.paymentStatus || '').toLowerCase() === 'unpaid'
            ? 'You are officially registered! Complete your payment anytime via Participant Payment.'
            : 'Your registration and payment proof have been securely received.'}
        </p>
      </div>

      {/* Unpaid Action Callout */}
      {String(registration?.paymentStatus || '').toLowerCase() === 'unpaid' && (
        <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-800/40 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Payment Status: Unpaid
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Ready to complete your registration payment?
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Please complete your registration payment using your Register Number (<strong className="text-white">{registration?.registerNumber}</strong>) to finalize your verified entry.
              </p>
            </div>
            <Link
              to={`/team-payment?regNo=${encodeURIComponent(registration?.registerNumber || '')}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-xs shadow-md shadow-[#6B9080]/20 transition-all shrink-0"
            >
              <span>Complete Payment Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Participant Details Summary */}
      <div className="p-6 rounded-2xl paper-card shadow-xl mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1A2E21]">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Registered Participant</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Registered
            </span>
            {String(registration?.paymentStatus || '').toLowerCase() === 'unpaid' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/50">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Payment: Unpaid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Payment: Paid
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Participant Card */}
          <div className="p-4 rounded-xl bg-[#0B130E] border border-[#1A2E21]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Individual Researcher
                </span>
                <div className="font-extrabold text-white text-lg">{registration?.fullName}</div>
              </div>
              <span className="font-mono font-bold text-xs bg-[#132219] px-2.5 py-1 rounded-lg border border-[#1A2E21] text-emerald-400 w-fit">
                {registration?.registerNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[#1A2E21]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                <span className="font-medium text-white">{registration?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Year & Sec</span>
                <span className="font-medium text-white">
                  {registration?.year} {registration?.section ? `• Sec ${registration?.section}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gender</span>
                <span className="font-medium text-white">{registration?.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="font-medium text-white">{registration?.phone}</span>
              </div>
            </div>
          </div>

          {registration?.transactionId && (
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-[#1A2E21] text-xs">
              <span className="text-slate-400">Transaction Reference:</span>
              <span className="font-mono font-bold text-emerald-400">{registration?.transactionId}</span>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Groups Joining Section */}
      {whatsappGroups.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-xl mb-8 text-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Join AgriVerse WhatsApp Groups</h3>
              <p className="text-xs text-slate-500">
                Receive round schedules, presentation guidelines, and track coordinators.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {whatsappGroups.map((group, idx) => (
              <a
                key={idx}
                href={group.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-xs"
              >
                <span>{group.name}</span>
                <ExternalLink className="w-4 h-4 text-slate-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="flex items-center justify-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-sm shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer"
        >
          <span>Back to Event Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default Success;
