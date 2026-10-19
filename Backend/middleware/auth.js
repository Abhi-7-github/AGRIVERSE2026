import jwt from 'jsonwebtoken';

export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_event_jwt_key_987654321'
    );

    const envUsername = (process.env.DEFAULT_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'agriverse2026').trim();
    const envEmail = (process.env.DEFAULT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'agriverse2026@gmail.com').trim().toLowerCase();

    req.admin = {
      _id: decoded.id || 'env-superadmin',
      id: decoded.id || 'env-superadmin',
      username: envUsername,
      email: envEmail,
      role: 'SUPERADMIN',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Token is invalid or expired',
    });
  }
};
