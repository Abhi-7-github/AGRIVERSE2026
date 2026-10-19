import mongoose from 'mongoose';

const WhatsAppGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const QRCodeItemSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: 'UPI QR Code',
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
  upiId: {
    type: String,
    trim: true,
    default: '',
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EventSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true,
  },
  registrationLimit: {
    type: Number,
    default: 100, // Max number of teams
    min: [1, 'Registration limit must be at least 1 team'],
  },
  currentRegistrations: {
    type: Number,
    default: 0,
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative'],
  },
  qrCode: {
    url: {
      type: String,
      default: '',
    },
    publicId: {
      type: String,
      default: '',
    },
  },
  qrCodes: [QRCodeItemSchema],
  whatsappGroups: [WhatsAppGroupSchema],
}, {
  timestamps: true,
});

export const EventSettings = mongoose.model('EventSettings', EventSettingsSchema);
export default EventSettings;
