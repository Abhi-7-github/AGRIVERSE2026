import express from 'express';
import { adminLogin, adminLogout, getAdminProfile } from '../controllers/authController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin/login', (req, res) => {
  res.status(200).json({
    success: true,
    message:
      'Admin Login API Endpoint. Send an HTTP POST request with { emailOrUsername, password } to authenticate.',
    frontendLoginUrl: '/admin/login',
  });
});

router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.get('/admin/me', protectAdmin, getAdminProfile);

export default router;
