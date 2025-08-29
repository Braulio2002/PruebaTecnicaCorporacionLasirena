import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface Metrics {
  requests: number;
  errors: number;
  responseTime: number[];
}

const metrics: Metrics = {
  requests: 0,
  errors: 0,
  responseTime: []
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  metrics.requests++;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.responseTime.push(duration);
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }

    logger.info('Request metrics', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

export const getMetrics = () => {
  const avgResponseTime = metrics.responseTime.length > 0 
    ? metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length 
    : 0;

  return {
    totalRequests: metrics.requests,
    totalErrors: metrics.errors,
    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0,
    averageResponseTime: Math.round(avgResponseTime),
    uptime: process.uptime()
  };
};