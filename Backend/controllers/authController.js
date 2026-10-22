import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_event_jwt_key_987654321', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper to retrieve environment admin credentials
const getEnvAdminCredentials = () => {
  const username = (process.env.DEFAULT_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'agriverse2026').trim();
  const email = (process.env.DEFAULT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'agriverse2026@gmail.com').trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'agriverse2026';
  return { username, email, password };
};

// @desc    Admin login
// @route   POST /api/v1/auth/admin/login
// @access  Public
export const adminLogin = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const { username: envUsername, email: envEmail, password: envPassword } = getEnvAdminCredentials();
    const cleanIdentifier = String(emailOrUsername).trim().toLowerCase();

    const isIdentifierMatch =
      cleanIdentifier === envEmail ||
      cleanIdentifier === envUsername.toLowerCase();

    // Constant-time password comparison to prevent timing disclosure attacks
    const bufferUser = crypto.createHash('sha256').update(String(password)).digest();
    const bufferEnv = crypto.createHash('sha256').update(String(envPassword)).digest();
    const isPasswordMatch = crypto.timingSafeEqual(bufferUser, bufferEnv);

    if (!isIdentifierMatch || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const admin = {
      id: 'env-superadmin',
      username: envUsername,
      email: envEmail,
      role: 'SUPERADMIN',
      lastLogin: new Date().toISOString(),
    };

    const token = generateToken(admin.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin logout
// @route   POST /api/v1/auth/admin/logout
// @access  Public / Private
export const adminLogout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get Current Admin Profile
// @route   GET /api/v1/auth/admin/me
// @access  Private
export const getAdminProfile = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
};
