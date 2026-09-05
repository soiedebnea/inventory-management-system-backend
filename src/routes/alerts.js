import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRestockAlerts, getDashboardSummary, getStockLogs } from '../controllers/alertController.js';

const router = Router();

router.get('/', asyncHandler(getRestockAlerts));
router.get('/summary', asyncHandler(getDashboardSummary));
router.get('/logs', asyncHandler(getStockLogs));

export default router;