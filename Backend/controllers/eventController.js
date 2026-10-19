import EventSettings from '../models/EventSettings.js';
import Registration from '../models/Registration.js';

let cachedPublicSettings = null;
let lastPublicFetchTime = 0;
const CACHE_TTL_MS = 1500; // 1.5s cache prevents DB lock congestion during high concurrency bursts

// @desc    Get public event settings and live registration stats
// @route   GET /api/v1/event/settings
// @access  Public
export const getPublicEventSettings = async (req, res, next) => {
  try {
    const now = Date.now();
    if (cachedPublicSettings && now - lastPublicFetchTime < CACHE_TTL_MS) {
      return res.status(200).json(cachedPublicSettings);
    }

    let settings = await EventSettings.findOne().lean();
    if (!settings) {
      settings = await EventSettings.create({});
      settings = settings.toObject();
    }

    const registeredTeams = await Registration.countDocuments();
    if (settings.currentRegistrations !== registeredTeams) {
      EventSettings.updateOne(
        {},
        { $set: { currentRegistrations: registeredTeams } },
      ).catch(() => {});
    }

    const limit = typeof settings.registrationLimit === 'number' ? settings.registrationLimit : null;
    const isFull = limit !== null && limit > 0 ? registeredTeams >= limit : false;
    const remainingSlots = limit !== null && limit > 0 ? Math.max(0, limit - registeredTeams) : null;

    // Filter active whatsapp groups and sort by order
    const activeWhatsAppGroups = (settings.whatsappGroups || [])
      .filter((g) => g.active)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((g) => ({
        id: g._id,
        name: g.name,
        url: g.url,
      }));

    // Filter active QR codes
    let activeQRCodes = (settings.qrCodes || [])
      .filter((q) => q.active !== false && q.url)
      .map((q) => ({
        id: q._id ? String(q._id) : undefined,
        title: q.title || "UPI QR Code",
        url: q.url,
        upiId: q.upiId || "",
        active: q.active !== false,
      }));

    if (activeQRCodes.length === 0 && settings.qrCode?.url) {
      activeQRCodes = [
        {
          id: "primary",
          title: "Primary UPI QR",
          url: settings.qrCode.url,
          upiId: "",
          active: true,
        },
      ];
    }

    const responsePayload = {
      success: true,
      event: {
        registrationOpen: Boolean(settings.registrationOpen) && !isFull,
        isSystemOpen: Boolean(settings.registrationOpen),
        isFull,
        registrationLimit: limit,
        registeredTeams,
        remainingSlots,
        progressPercent: limit && limit > 0 ? Math.min(100, Math.round((registeredTeams / limit) * 100)) : 0,
        registrationFee: settings.registrationFee ?? 0,
        qrCode: settings.qrCode?.url ? settings.qrCode : (activeQRCodes[0] || null),
        qrCodes: activeQRCodes,
        whatsappGroups: activeWhatsAppGroups,
      },
    };

    cachedPublicSettings = responsePayload;
    lastPublicFetchTime = now;

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// @desc    Lightweight check for registration availability (called on Register button click)
// @route   GET /api/v1/event/status or /api/v1/event/registration-status
// @access  Public
export const checkRegistrationStatus = async (req, res, next) => {
  try {
    let settings = await EventSettings.findOne();
    if (!settings) {
      settings = await EventSettings.create({});
    }

    const registeredCount = await Registration.countDocuments();
    await EventSettings.updateOne({}, { $set: { currentRegistrations: registeredCount } });
    const limit = typeof settings.registrationLimit === 'number' ? settings.registrationLimit : null;
    const isFull = limit !== null && limit > 0 ? registeredCount >= limit : false;
    const isSystemOpen = Boolean(settings.registrationOpen);
    const isOpen = isSystemOpen && !isFull;
    const remainingSlots = limit !== null && limit > 0 ? Math.max(0, limit - registeredCount) : null;

    let message = 'Registration is open.';
    if (!isSystemOpen) {
      message = 'Registrations are currently closed by the event administrators.';
    } else if (isFull) {
      message = `Registration is full (${limit} of ${limit} slots filled).`;
    }

    res.status(200).json({
      success: true,
      isOpen,
      isSystemOpen,
      isFull,
      registeredCount,
      limit,
      remainingSlots,
      message,
    });
  } catch (error) {
    next(error);
  }
};
