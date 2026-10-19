import express from 'express';
import { getPublicEventSettings, checkRegistrationStatus } from '../controllers/eventController.js';

const router = express.Router();

router.get('/settings', getPublicEventSettings);
router.get('/status', checkRegistrationStatus);
router.get('/registration-status', checkRegistrationStatus);

export default router;
