import { Router } from 'express';
import { getMetrics } from '../middleware/metrics';

const router = Router();

router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: getMetrics()
  });
});

export default router;