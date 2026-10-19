import express from 'express';
import { adminLogin, adminLogout, getAdminProfile } from '../controllers/authController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/admin/logout', adminLogout);
router.get('/admin/me', protectAdmin, getAdminProfile);

export default router;
