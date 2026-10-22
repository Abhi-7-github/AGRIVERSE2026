import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  RefreshCw,
  QrCode,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Upload,
  ArrowLeft,
  Copy,
  ChevronDown,
  X,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useEvent } from '../context/EventContext';
import {
  checkAvailability,
  createRegistration,
  submitPayment,
  checkRegistrationStatus,
  getRegistrationStatus,
  getMediaUrl,
} from '../api/client';
import {
  AgriGenLeaf,
  IconUser,
  IconId,
  IconBook,
  IconGroup,
  IconHome,
  IconCalendar,
  IconMale,
  IconFemale,
  IconOther,
  IconLock,
  IconArrow,
  IconRocket,
  IconPhone,
} from '../components/AgrigenIcons';
import Navbar from '../components/Navbar';
import FloatingHelpButton from '../components/FloatingHelpButton';
import agriFieldBg from '../assets/agri-field-bg.jpg';
import registrationTemplateBg from '../assets/registration-template-bg.png';

const initialParticipantState = {
  fullName: '',
  registerNumber: '',
  phone: '',
  email: '',
  department: '',
  section: '',
  residency: 'Day Scholar',
  year: '',
  gender: 'Male',
};

const residencies = ['Day Scholar', 'Hosteller'];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'];

const DRAFT_KEY = 'agrigen_solo_registration_draft_v4';
const PAYMENT_SESSION_KEY = 'agrigen_active_payment_session_v1';

const getInitialDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { }
  return null;
};

const getInitialPaymentSession = () => {
  try {
    const saved = sessionStorage.getItem(PAYMENT_SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.step === 2 && parsed.registeredParticipant) {
        return parsed;
      }
    }
  } catch (e) { }
  return null;
};

const Register = () => {
  const navigate = useNavigate();
  const { eventData, refreshEvent } = useEvent();

  const draft = getInitialDraft();
  const savedPaymentSession = getInitialPaymentSession();

  // Step 1 = Profile Registration, Step 2 = Payment/Verification
  const [step, setStep] = useState(savedPaymentSession ? 2 : 1);

  // Form State
  const [formData, setFormData] = useState(
    savedPaymentSession?.formData
      ? savedPaymentSession.formData
      : draft
      ? { ...initialParticipantState, ...draft }
      : { ...initialParticipantState }
  );

  // Registered Participant Data
  const [registeredParticipant, setRegisteredParticipant] = useState(
    savedPaymentSession?.registeredParticipant || null
  );
  const [whatsappGroups, setWhatsappGroups] = useState(
    savedPaymentSession?.whatsappGroups || []
  );

  // Payment State
  const [transactionId, setTransactionId] = useState(
    savedPaymentSession?.transactionId || ''
  );
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [latestQrCode, setLatestQrCode] = useState(
    savedPaymentSession?.latestQrCode || null
  );
  const [latestQrCodes, setLatestQrCodes] = useState(
    savedPaymentSession?.latestQrCodes || null
  );
  const [selectedQrIndex, setSelectedQrIndex] = useState(
    savedPaymentSession?.selectedQrIndex || 0
  );
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrRefreshStatus, setQrRefreshStatus] = useState('');
  const [qrRefreshMsg, setQrRefreshMsg] = useState('');

  const handleRefreshQr = async () => {
    if (isRefreshingQr) return;
    setIsRefreshingQr(true);
    setQrRefreshStatus('');
    try {
      const updated = await refreshEvent();
      if (updated?.qrCodes && updated.qrCodes.length > 0) {
        setLatestQrCodes(updated.qrCodes);
      }
      if (updated?.qrCode) {
        setLatestQrCode(updated.qrCode);
      }
      if (updated?.whatsappGroups && updated.whatsappGroups.length > 0) {
        setWhatsappGroups(updated.whatsappGroups);
      }
      setQrRefreshStatus('success');
      setQrRefreshMsg('QR Codes refreshed!');
      setTimeout(() => {
        setQrRefreshMsg('');
        setQrRefreshStatus('');
      }, 3500);
    } catch (err) {
      setQrRefreshStatus('error');
      setQrRefreshMsg('Failed to refresh QR');
      setTimeout(() => {
        setQrRefreshMsg('');
        setQrRefreshStatus('');
      }, 3500);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Validation & Modal Confirmation States
  const [regNoStatus, setRegNoStatus] = useState({ checking: false, available: null, message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingLockRef = useRef(false);
  const [submitError, setSubmitError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Handle register number input (numbers only, max 15 digits) and automatically compute KLU email
  const handleRegNoChange = (val) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 15);
    const autoEmail = cleanVal ? `${cleanVal}@klu.ac.in` : '';
    setFormData((prev) => ({
      ...prev,
      registerNumber: cleanVal,
      email: autoEmail,
    }));
    if (errors.registerNumber) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.registerNumber;
        return next;
      });
    }
  };

  // Check register number availability debounce
  useEffect(() => {
    if (!formData.registerNumber || formData.registerNumber.trim().length < 5 || step === 2) {
      setRegNoStatus({ checking: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setRegNoStatus({ checking: true, available: null, message: '' });
      try {
        const res = await checkAvailability({ registerNumber: formData.registerNumber.trim().toUpperCase() });
        if (res.available) {
          setRegNoStatus({ checking: false, available: true, message: 'Available' });
        } else {
          setRegNoStatus({
            checking: false,
            available: false,
            message: res.errors?.registerNumber || 'Already registered',
          });
        }
      } catch (err) {
        setRegNoStatus({ checking: false, available: null, message: '' });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.registerNumber, step]);

  // Save draft
  useEffect(() => {
    if (step === 1) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch (e) { }
    }
  }, [formData, step]);

  // Sync latest whatsapp groups from public event settings if currently empty
  useEffect(() => {
    if ((!whatsappGroups || whatsappGroups.length === 0) && eventData?.whatsappGroups?.length > 0) {
      setWhatsappGroups(eventData.whatsappGroups);
    }
  }, [eventData?.whatsappGroups, whatsappGroups]);

  // Keep active payment session synced in sessionStorage so whole-page refresh preserves Step 2, QR, and transactionId
  useEffect(() => {
    if (step === 2 && registeredParticipant) {
      try {
        const sessionPayload = {
          step: 2,
          registeredParticipant,
          whatsappGroups,
          latestQrCode,
          latestQrCodes,
          selectedQrIndex,
          transactionId,
          formData,
        };
        sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(sessionPayload));
      } catch (e) { }
    }
  }, [step, registeredParticipant, whatsappGroups, latestQrCode, latestQrCodes, selectedQrIndex, transactionId, formData]);

  // If restoring an active payment session on refresh, check if already verified by admin
  useEffect(() => {
    if (savedPaymentSession && registeredParticipant?.registrationId) {
      getRegistrationStatus(registeredParticipant.registrationId)
        .then((res) => {
          if (res?.success && res?.registration) {
            if (res.registration.paymentStatus === 'VERIFIED') {
              try {
                sessionStorage.removeItem(PAYMENT_SESSION_KEY);
              } catch (e) { }
              navigate(`/success/${res.registration.registrationId}`, {
                state: {
                  registration: res.registration,
                  whatsappGroups: res.whatsappGroups || whatsappGroups,
                },
              });
            } else {
              setRegisteredParticipant(res.registration);
            }
          }
        })
        .catch(() => { });
    }
  }, []);

  // Route Guard: Block direct URL access if registrations are closed (unless resuming Step 2 payment)
  useEffect(() => {
    if (savedPaymentSession || step === 2) return;

    checkRegistrationStatus()
      .then((res) => {
        if (res && res.success && !res.isOpen) {
          navigate('/', { replace: true });
        }
      })
      .catch(() => { });
  }, [savedPaymentSession, step, navigate]);

  const handleStartNewRegistration = () => {
    if (
      window.confirm(
        'Are you sure you want to exit the payment page and start a new registration?'
      )
    ) {
      try {
        sessionStorage.removeItem(PAYMENT_SESSION_KEY);
      } catch (e) { }
      setRegisteredParticipant(null);
      setTransactionId('');
      setPaymentScreenshot(null);
      setPreviewUrl('');
      setStep(1);
    }
  };

  // Clean up object url preview
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    
    const regNoClean = formData.registerNumber.trim();
    if (!regNoClean) {
      errs.registerNumber = 'Registration number is required';
    } else if (!/^\d+$/.test(regNoClean)) {
      errs.registerNumber = 'Registration number must contain numbers only';
    } else if (regNoClean.length < 5 || regNoClean.length > 15) {
      errs.registerNumber = 'Registration number must be between 5 and 15 digits';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      errs.phone = '10-digit mobile number is required';
    }
    if (!formData.department.trim()) errs.department = 'Branch is required';
    if (!formData.section.trim()) errs.section = 'Section is required';
    if (!formData.residency) errs.residency = 'Residency is required';
    if (!formData.year.trim()) errs.year = 'Year is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateStep1()) return;

    // Show professional detail verification toast/modal before proceeding to payment
    setShowConfirmModal(true);
  };

  const executeRegistrationSubmit = async () => {
    if (submittingLockRef.current || isSubmitting) return;
    submittingLockRef.current = true;
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const statusRes = await checkRegistrationStatus();
      if (statusRes && statusRes.success && !statusRes.isOpen) {
        setSubmitError(statusRes.message || 'Registrations are currently closed.');
        await refreshEvent();
        return;
      }

      const autoEmail = formData.email || (formData.registerNumber ? `${formData.registerNumber.trim().toLowerCase()}@klu.ac.in` : '');

      const payload = {
        fullName: formData.fullName.trim(),
        registerNumber: formData.registerNumber.trim().toUpperCase(),
        phone: formData.phone.trim(),
        email: autoEmail,
        department: formData.department.trim(),
        section: formData.section.trim().toUpperCase(),
        residency: formData.residency || 'Day Scholar',
        year: formData.year.trim(),
        gender: formData.gender,
      };

      const res = await createRegistration(payload);

      if (res.success && res.registration) {
        setRegisteredParticipant(res.registration);
        setWhatsappGroups(res.whatsappGroups || []);
        if (res.event?.qrCode) {
          setLatestQrCode(res.event.qrCode);
        }
        if (res.event?.qrCodes) {
          setLatestQrCodes(res.event.qrCodes);
        }

        try {
          localStorage.removeItem(DRAFT_KEY);
          sessionStorage.setItem(
            PAYMENT_SESSION_KEY,
            JSON.stringify({
              step: 2,
              registeredParticipant: res.registration,
              whatsappGroups: res.whatsappGroups || [],
              latestQrCode: res.event?.qrCode || null,
              latestQrCodes: res.event?.qrCodes || null,
              selectedQrIndex: 0,
              transactionId: '',
              formData: payload,
            })
          );
        } catch (err) { }

        refreshEvent();
        setStep(2);
      }
    } catch (err) {
      await refreshEvent();
      const msg =
        err.response?.data?.message ||
        'Failed to complete registration. Please check your details and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      submittingLockRef.current = false;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          paymentScreenshot: 'Invalid format. Use JPG, PNG, or WEBP.',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          paymentScreenshot: 'File size exceeds 5MB limit.',
        }));
        return;
      }

      setPaymentScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.paymentScreenshot;
        return next;
      });
    }
  };

  const handleImmediatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (submittingLockRef.current || isSubmitting) return;
    setSubmitError('');

    const errs = {};
    if (!transactionId || transactionId.trim().length < 4) {
      errs.transactionId = 'Please enter a valid Transaction ID.';
    }
    if (!paymentScreenshot) {
      errs.paymentScreenshot = 'Please upload a screenshot of your receipt.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);

    try {
      const activeParticipant = registeredParticipant || {
        registerNumber: formData.registerNumber,
        registrationId: '',
      };

      const payloadForm = new FormData();
      payloadForm.append('registerNumber', activeParticipant.registerNumber);
      if (activeParticipant.registrationId) {
        payloadForm.append('registrationId', activeParticipant.registrationId);
      }
      payloadForm.append('transactionId', transactionId.trim().toUpperCase());
      payloadForm.append('paymentScreenshot', paymentScreenshot);

      const res = await submitPayment(payloadForm);

      if (res.success && res.registration) {
        try {
          sessionStorage.removeItem(PAYMENT_SESSION_KEY);
        } catch (e) { }
        refreshEvent();
        navigate(`/success/${res.registration.registrationId}`, {
          state: {
            registration: res.registration,
            whatsappGroups: res.whatsappGroups || whatsappGroups,
          },
        });
      }
    } catch (err) {
      console.error('Payment submission failed:', err);
      const msg =
        err.response?.data?.message ||
        'Payment submission failed. Please verify your transaction details and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
      submittingLockRef.current = false;
    }
  };

  const handlePayLater = () => {
    if (registeredParticipant?.registrationId) {
      try {
        sessionStorage.removeItem(PAYMENT_SESSION_KEY);
      } catch (e) { }
      navigate(`/success/${registeredParticipant.registrationId}`, {
        state: {
          registration: registeredParticipant,
          whatsappGroups: whatsappGroups,
        },
      });
    }
  };

  const registrationFee = eventData?.registrationFee || 350;

  // Active WhatsApp groups configured in backend (no default hardcoded group)
  const availableWhatsAppGroups =
    whatsappGroups && whatsappGroups.length > 0
      ? whatsappGroups
      : eventData?.whatsappGroups && eventData.whatsappGroups.length > 0
        ? eventData.whatsappGroups
        : [];

  // Compute full list of available QR codes
  const allQrCodes = (() => {
    const list = latestQrCodes || eventData?.qrCodes;
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((item, idx) => {
          const rawUrl = typeof item === 'string' ? item : item.url;
          const fullUrl = rawUrl ? getMediaUrl(rawUrl) : null;
          return {
            id: item.id || item._id || idx,
            title: item.title || `UPI QR ${idx + 1}`,
            url: fullUrl,
            upiId: item.upiId || '',
          };
        })
        .filter((item) => Boolean(item.url));
    }
    // Fallback to legacy single QR
    const rawSingle = latestQrCode || eventData?.qrCode;
    const singleUrl = typeof rawSingle === 'string'
      ? getMediaUrl(rawSingle)
      : rawSingle?.url
        ? getMediaUrl(rawSingle.url)
        : null;
    if (singleUrl) {
      return [
        {
          id: 'primary',
          title: 'Primary UPI QR',
          url: singleUrl,
          upiId: '',
        },
      ];
    }
    return [];
  })();

  const activeQr = allQrCodes[selectedQrIndex] || allQrCodes[0] || null;
  const qrImageUrl = activeQr?.url || null;

  const displayEmail = formData.registerNumber.trim()
    ? `${formData.registerNumber.trim().toLowerCase()}@klu.ac.in`
    : 'regno@klu.ac.in';

  return (
    <div
      className="min-h-screen w-full bg-[#F6FAF8] text-slate-800 relative overflow-x-hidden font-sans flex flex-col justify-start selection:bg-[#6B9080] selection:text-white"
      style={{
        backgroundImage: `url(${registrationTemplateBg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Floating Global Navbar */}
      <Navbar />

      {/* Main Section - Centered cleanly so the card sits entirely within the background template's inner frame */}
      <main className="relative z-10 w-full px-4 sm:px-6 flex-1 flex items-center justify-center pt-20 pb-8 sm:pt-24 sm:pb-10">
        <div className="w-full max-w-[580px] sm:max-w-[600px] mx-auto rounded-[28px] sm:rounded-[32px] bg-white shadow-[0_15px_40px_rgba(20,61,43,0.08)] p-5 sm:p-6 sm:px-7 relative text-left border border-slate-200/90 transition-all">

              {/* Stepper Header from User Image */}
              <div className="flex items-center justify-between pb-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* Step 1 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        step === 1 ? 'bg-[#00D084]' : 'bg-[#6B9080]'
                      }`}
                    >
                      {step > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Join AgriVerse</span>
                  </div>

                  {/* Connecting Line 1 -> 2 */}
                  <div className={`w-6 sm:w-10 h-[2px] rounded-full ${step > 1 ? 'bg-[#6B9080]' : 'bg-slate-200'}`} />

                  {/* Step 2 */}
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      step === 2 ? 'bg-[#00D084] text-white shadow-sm' : 'text-slate-400 bg-slate-100'
                    }`}
                  >
                    2
                  </div>

                  {/* Connecting Line 2 -> 3 */}
                  <div className="w-6 sm:w-10 h-[2px] rounded-full bg-slate-200" />

                  {/* Step 3 */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-100">
                    3
                  </div>
                </div>

                {/* Let's Grow Together Tagline with Logo */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 font-medium shrink-0">
                  <span>Let's Grow Together</span>
                  <img src="/assets/kare-tech-logo.png" alt="KARE Tech" className="w-4 h-4 rounded-full object-contain bg-black p-0.5" />
                </div>
              </div>

              {/* Error Alert */}
              {submitError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Step 1: Create Profile */}
              {step === 1 && (
                <form onSubmit={handleRegisterSubmit}>
                  {/* Card Title & Subtitle */}
                  <div className="text-center mb-3 sm:mb-4">
                    <h2
                      className="text-3xl sm:text-4xl text-[#52B788] leading-tight"
                      style={{ fontFamily: "'Dancing Script', 'Cormorant Garamond', cursive" }}
                    >
                      Profile
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Fill in your academic details to register for AgriVerse 2026.
                    </p>
                  </div>

                  {/* Form Grid */}
                  <div className="space-y-2.5 sm:space-y-3 mb-3.5 sm:mb-4">

                    {/* Row 1: Name & Registration Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                      {/* Name */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconUser className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Name</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border ${
                            errors.fullName ? 'border-rose-500' : 'border-slate-200'
                          } text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs transition-all`}
                        />
                        {errors.fullName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.fullName}</p>}
                      </div>

                      {/* Registration Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <IconId className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                            <span>Registration Number</span>
                          </label>
                          {regNoStatus.checking && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-sans">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#52B788]" /> checking
                            </span>
                          )}
                          {!regNoStatus.checking && regNoStatus.available === true && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 font-sans">
                              <Check className="w-3 h-3 stroke-[3]" /> available
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={15}
                          value={formData.registerNumber}
                          onChange={(e) => handleRegNoChange(e.target.value)}
                          placeholder="Enter Your Reg No"
                          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border font-mono ${
                            errors.registerNumber || regNoStatus.available === false
                              ? 'border-rose-500'
                              : 'border-slate-200'
                          } text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs transition-all`}
                        />
                        {/* Auto-generated KLU Email Display */}
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#52B788] font-mono tracking-wide">
                          <span className="text-[#52B788] text-[10px]">✉</span>
                          <span className="truncate">{displayEmail}</span>
                        </div>
                        {errors.registerNumber && (
                          <p className="text-[11px] text-rose-500 mt-0.5">{errors.registerNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Mobile Number & Branch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                      {/* Mobile Number */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconPhone className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Mobile Number</span>
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 10-digit mobile numb"
                          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border font-mono ${
                            errors.phone ? 'border-rose-500' : 'border-slate-200'
                          } text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs transition-all`}
                        />
                        {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconBook className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Branch</span>
                        </label>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => handleFieldChange('department', e.target.value)}
                          placeholder="Enter your branch"
                          className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl bg-white border ${
                            errors.department ? 'border-rose-500' : 'border-slate-200'
                          } text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs transition-all`}
                        />
                        {errors.department && <p className="text-[11px] text-rose-400 mt-0.5">{errors.department}</p>}
                      </div>
                    </div>

                    {/* Row 3: Section, Residency & Year (3 columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {/* Section */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconGroup className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Section</span>
                        </label>
                        <input
                          type="text"
                          value={formData.section}
                          onChange={(e) => handleFieldChange('section', e.target.value)}
                          placeholder="Enter section"
                          className={`w-full px-3 py-2 sm:py-2.5 rounded-xl bg-white border ${
                            errors.section ? 'border-rose-500' : 'border-slate-200'
                          } text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs transition-all`}
                        />
                        {errors.section && <p className="text-[11px] text-rose-500 mt-0.5">{errors.section}</p>}
                      </div>

                      {/* Residency */}
                      <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconHome className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Residency</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.residency}
                            onChange={(e) => handleFieldChange('residency', e.target.value)}
                            className={`w-full px-3 py-2 sm:py-2.5 pr-7 rounded-xl bg-white border ${
                              errors.residency ? 'border-rose-500' : 'border-slate-200'
                            } text-xs sm:text-sm text-slate-800 appearance-none focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs cursor-pointer`}
                          >
                            {residencies.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {errors.residency && <p className="text-[11px] text-rose-500 mt-0.5">{errors.residency}</p>}
                      </div>

                      {/* Year */}
                      <div className="relative">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                          <IconCalendar className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                          <span>Year</span>
                        </label>
                        <div className="relative">
                          <select
                            value={formData.year}
                            onChange={(e) => handleFieldChange('year', e.target.value)}
                            className={`w-full px-3 py-2 sm:py-2.5 pr-7 rounded-xl bg-white border ${
                              errors.year ? 'border-rose-500' : 'border-slate-200'
                            } text-xs sm:text-sm ${formData.year ? 'text-slate-800' : 'text-slate-400'} appearance-none focus:outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20 shadow-2xs cursor-pointer`}
                          >
                            <option value="" disabled>Select year</option>
                            {years.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        {errors.year && <p className="text-[11px] text-rose-500 mt-0.5">{errors.year}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Gender Selector from Image 1 */}
                  <div className="mb-3.5 sm:mb-4">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                      <span className="text-[#52B788] text-xs">⚥</span>
                      <span>Gender</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {/* Male */}
                      <button
                        type="button"
                        onClick={() => handleFieldChange('gender', 'Male')}
                        className={`relative flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                          formData.gender === 'Male'
                            ? 'bg-[#6B9080] border-[#6B9080] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-[#6B9080]'
                        }`}
                      >
                        <IconMale className={`w-3.5 h-3.5 shrink-0 ${formData.gender === 'Male' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold">Male</span>
                        {formData.gender === 'Male' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3] text-white" />
                          </div>
                        )}
                      </button>

                      {/* Female */}
                      <button
                        type="button"
                        onClick={() => handleFieldChange('gender', 'Female')}
                        className={`relative flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                          formData.gender === 'Female'
                            ? 'bg-[#6B9080] border-[#6B9080] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-[#6B9080]'
                        }`}
                      >
                        <IconFemale className={`w-3.5 h-3.5 shrink-0 ${formData.gender === 'Female' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold">Female</span>
                        {formData.gender === 'Female' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3] text-white" />
                          </div>
                        )}
                      </button>

                      {/* Other */}
                      <button
                        type="button"
                        onClick={() => handleFieldChange('gender', 'Other')}
                        className={`relative flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl border transition-all cursor-pointer ${
                          formData.gender === 'Other'
                            ? 'bg-[#6B9080] border-[#6B9080] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-[#6B9080]'
                        }`}
                      >
                        <IconOther className={`w-3.5 h-3.5 shrink-0 ${formData.gender === 'Other' ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold">Other</span>
                        {formData.gender === 'Other' && (
                          <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3] text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Register Action Button from Image 1 */}
                  <button
                    type="submit"
                    disabled={isSubmitting || regNoStatus.available === false}
                    className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-sans font-bold text-xs sm:text-sm tracking-wide border border-[#6B9080] transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#6B9080]/20 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Register Now (₹{registrationFee || 350})</span>
                        <IconArrow className="w-4 h-4 text-white stroke-[2.5]" />
                      </>
                    )}
                  </button>

                  {/* Security Footer Notes from Image 1 */}
                  <div className="flex items-center justify-between pt-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <IconLock className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                      <span>Your information is safe with us.</span>
                    </div>
                    <div className="flex items-center gap-1.5 tracking-wider uppercase text-[10px] text-slate-400">
                      <span>FOR A SUSTAINABLE FUTURE</span>
                      <span className="w-3 h-px bg-slate-400" />
                    </div>
                  </div>
                </form>
              )}

              {/* Step 2: Payment Verification inside White Card */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Confirm &amp; <span className="text-[#52B788]">Verify Payment</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Submit transaction verification to complete registration.
                      </p>
                    </div>
                  </div>

                  {/* Registered Participant Summary */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#52B788]">
                        Registered Participant
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs sm:text-sm text-[#52B788] hover:underline font-semibold cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-slate-900">
                      {registeredParticipant?.fullName || formData.fullName}
                    </div>
                    <div className="text-xs sm:text-sm font-mono text-slate-600 mt-0.5">
                      {registeredParticipant?.registerNumber || formData.registerNumber} • {displayEmail}
                    </div>
                  </div>

                  {registrationFee > 0 ? (
                    <form onSubmit={handleImmediatePaymentSubmit} className="space-y-5">
                      <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                            Payment UPI QR Code
                          </span>
                          <button
                            type="button"
                            onClick={handleRefreshQr}
                            disabled={isRefreshingQr}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                            title="Receiver limit over? Click to refresh and fetch updated QR Codes"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin text-[#52B788]' : ''}`} />
                            <span>{isRefreshingQr ? 'Refreshing...' : 'Refresh QRs'}</span>
                          </button>
                        </div>

                        {/* Multiple Account Tabs */}
                        {allQrCodes.length > 1 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 font-bold flex items-center gap-1.5">
                                <QrCode className="w-4 h-4 text-[#52B788]" />
                                Payment Accounts ({allQrCodes.length})
                              </span>
                              <span className="text-xs text-amber-700 font-medium">
                                Limit reached? Switch QR below ↓
                              </span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                              {allQrCodes.map((qr, idx) => {
                                const isSelected = selectedQrIndex === idx;
                                return (
                                  <button
                                    key={qr.id || idx}
                                    type="button"
                                    onClick={() => setSelectedQrIndex(idx)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                                      isSelected
                                        ? 'bg-[#6B9080] text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <span>{qr.title}</span>
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                          <div
                            onClick={() => qrImageUrl && setShowQrModal(true)}
                            className={`w-32 h-32 sm:w-36 sm:h-36 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center shrink-0 shadow-sm relative group ${
                              qrImageUrl ? 'cursor-pointer hover:ring-2 hover:ring-[#52B788] transition-all' : ''
                            }`}
                            title={qrImageUrl ? `Click to enlarge ${activeQr?.title || 'QR Code'}` : "QR Code"}
                          >
                            {qrImageUrl ? (
                              <>
                                <img src={qrImageUrl} alt={activeQr?.title || "Payment QR Code"} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                                  <span>Enlarge</span>
                                </div>
                              </>
                            ) : (
                              <QrCode className="w-16 h-16 text-[#52B788]" />
                            )}
                          </div>
                          <div className="text-sm space-y-2 flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-between">
                              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fee Amount</div>
                              {activeQr?.title && (
                                <span className="text-xs font-bold text-[#52B788] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 truncate max-w-[160px]">
                                  {activeQr.title}
                                </span>
                              )}
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-[#6B9080] font-mono">₹{registrationFee}</div>
                            {activeQr?.upiId && (
                              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-mono text-slate-700">
                                <span className="truncate max-w-[200px] text-[#52B788] font-bold">{activeQr.upiId}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeQr.upiId);
                                    setCopiedUpi(true);
                                    setTimeout(() => setCopiedUpi(false), 2000);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Copy UPI ID"
                                >
                                  {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            )}
                            {qrImageUrl && (
                              <button
                                type="button"
                                onClick={() => setShowQrModal(true)}
                                className="text-xs text-[#52B788] hover:underline font-semibold flex items-center justify-center sm:justify-start gap-1 cursor-pointer transition-colors"
                              >
                                <span>Tap QR code to enlarge</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* All QRs thumbnail selector */}
                        {allQrCodes.length > 1 && (
                          <div className="pt-3 border-t border-slate-200 space-y-2">
                            <span className="text-xs text-slate-500 font-semibold block">
                              All Available QRs (Tap to switch):
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                              {allQrCodes.map((qr, idx) => {
                                const isSelected = selectedQrIndex === idx;
                                return (
                                  <div
                                    key={qr.id || idx}
                                    onClick={() => setSelectedQrIndex(idx)}
                                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-emerald-50 border-[#6B9080] ring-2 ring-[#6B9080]"
                                        : "bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                                    }`}
                                  >
                                    <div className="w-full h-14 bg-white rounded-lg p-1 flex items-center justify-center mb-1">
                                      <img src={qr.url} alt={qr.title} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="text-xs font-bold truncate text-slate-800">
                                      {qr.title}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                          <span>UPI limit over? Switch QR or tap Refresh QRs</span>
                          {qrRefreshMsg && (
                            <span className={`font-bold px-2 py-0.5 rounded ${qrRefreshStatus === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {qrRefreshMsg}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
                          Transaction ID / UTR <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                          placeholder="Enter UTR / Transaction reference"
                          className="w-full px-5 py-3.5 sm:py-4 rounded-2xl bg-white border border-slate-200 font-mono tracking-wider text-sm sm:text-base uppercase text-slate-800 outline-none focus:border-[#6B9080] focus:ring-2 focus:ring-[#6B9080]/20"
                        />
                        {errors.transactionId && (
                          <p className="text-xs sm:text-sm text-rose-500 mt-1.5">{errors.transactionId}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
                          Payment Screenshot <span className="text-rose-500">*</span>
                        </label>
                        <label className="flex items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white cursor-pointer hover:border-[#6B9080] transition-all">
                          <Upload className="w-5 h-5 text-[#52B788]" />
                          <span className="text-xs sm:text-sm text-slate-600 font-medium">
                            {previewUrl ? 'Screenshot Attached (Click to change)' : 'Upload Receipt Screenshot (JPG, PNG)'}
                          </span>
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        {errors.paymentScreenshot && (
                          <p className="text-xs sm:text-sm text-rose-500 mt-1.5">{errors.paymentScreenshot}</p>
                        )}
                      </div>

                      {/* Official WhatsApp Group joining section */}
                      {availableWhatsAppGroups && availableWhatsAppGroups.length > 0 && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                              <MessageCircle className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-bold text-slate-900 text-sm">
                                Join Official WhatsApp Group
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Join our official WhatsApp group for schedules, presentation updates, and event coordinators.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {availableWhatsAppGroups.map((group, idx) => (
                              <a
                                key={group.id || group._id || idx}
                                href={group.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
                              >
                                <span>{group.name || 'Join WhatsApp Group'}</span>
                                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4.5 sm:py-5 px-8 rounded-2xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-[#6B9080]/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit To Complete Registration ➔'}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                      <p className="text-xs text-slate-600">
                        Complimentary entry confirmed for this session!
                      </p>
                      <button
                        type="button"
                        onClick={handlePayLater}
                        className="w-full py-3.5 px-6 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>View Registration Status</span>
                        <IconArrow className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
        </div>
      </main>

      {/* Verification & Detail Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all animate-in fade-in duration-200"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-[440px] rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.2)] text-slate-800 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF2EE] border border-[#6B9080]/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#6B9080]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    Verify Your Details
                  </h3>
                  <p className="text-xs text-[#6B9080] font-semibold mt-0.5">
                    Important Pre-Submission Check
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="mb-4 p-3.5 rounded-2xl bg-[#F0F5F2] border border-[#6B9080]/30 text-[#2D5A46] text-xs leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#6B9080] shrink-0 mt-0.5" />
              <span>
                Please check every detail carefully. <strong className="text-[#1B3B2E]">There will be NO option to change or edit your details again after proceeding to payment.</strong>
              </span>
            </div>

            {/* Structured Details Summary */}
            <div className="mb-5 p-4 rounded-2xl bg-[#F8FAF9] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-right">{formData.fullName}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Registration Number</span>
                <span className="font-mono font-bold text-[#6B9080] text-right">{formData.registerNumber}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mobile Number</span>
                <span className="font-mono font-bold text-slate-900 text-right">{formData.phone}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Branch &amp; Section</span>
                <span className="font-semibold text-slate-900 text-right">{formData.department} (Sec {formData.section})</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Year &amp; Residency</span>
                <span className="font-semibold text-slate-900 text-right">{formData.year} • {formData.residency}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
              >
                Review &amp; Edit
              </button>

              <button
                type="button"
                onClick={executeRegistrationSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-[#6B9080]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>Confirm &amp; Pay</span>
                    <IconArrow className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged QR Code Modal Popup */}
      {showQrModal && qrImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all animate-in fade-in duration-200"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white border border-slate-200 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.2)] text-slate-800 relative text-center flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-[#6B9080] text-xs font-bold uppercase tracking-wider mb-1">
              {activeQr?.title || 'Payment QR Code'}
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Scan to Pay ₹{registrationFee}
            </h3>

            {/* Multiple QR Selector inside Modal */}
            {allQrCodes.length > 1 && (
              <div className="w-full mb-3">
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                  {allQrCodes.map((qr, idx) => (
                    <button
                      key={qr.id || idx}
                      type="button"
                      onClick={() => setSelectedQrIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedQrIndex === idx
                          ? "bg-[#6B9080] text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {qr.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="w-64 h-64 bg-white p-3 rounded-2xl shadow-md flex items-center justify-center mb-3 border border-slate-200">
              <img src={qrImageUrl} alt={activeQr?.title || "Payment QR Code"} className="w-full h-full object-contain" />
            </div>

            {activeQr?.upiId && (
              <p className="text-xs font-mono text-[#6B9080] bg-[#F0F5F2] border border-[#6B9080]/30 px-3 py-1 rounded-lg mb-2">
                UPI ID: {activeQr.upiId}
              </p>
            )}

            {/* Refresh QR button inside modal */}
            <div className="w-full flex items-center justify-center gap-2 mb-2">
              <button
                type="button"
                onClick={handleRefreshQr}
                disabled={isRefreshingQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF2EE] hover:bg-[#d8e6df] border border-[#6B9080]/30 text-[#6B9080] hover:text-[#587B6C] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin text-[#6B9080]' : ''}`} />
                <span>{isRefreshingQr ? 'Fetching New QRs...' : 'Refresh QR Codes'}</span>
              </button>
            </div>

            {qrRefreshMsg && (
              <p className={`text-xs font-semibold mb-2 ${qrRefreshStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {qrRefreshMsg}
              </p>
            )}

            <p className="text-[11px] text-slate-500 max-w-xs mb-3">
              If your UPI app shows "Receiver limit reached", switch to another QR above or tap Refresh QR Codes.
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md shadow-[#6B9080]/20"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Interactive Floating Help Button & Contact Popover */}
      <FloatingHelpButton />
    </div>
  );
};

export default Register;
