/**
 * Resilient In-Memory Sliding Window Rate Limiter
 * Limits requests per IP within a specified time window to prevent brute-force attacks and abuse.
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) => {
  const hits = new Map();

  // Periodic cleanup of expired IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const validTimestamps = timestamps.filter((time) => now - time < windowMs);
      if (validTimestamps.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // In test environment or healthcheck, skip rate limiting
    if (process.env.NODE_ENV === 'test' || req.path === '/api/health') {
      return next();
    }

    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      '127.0.0.1';

    const now = Date.now();
    const timestamps = (hits.get(ip) || []).filter((time) => now - time < windowMs);

    if (timestamps.length >= max) {
      const oldestHit = timestamps[0];
      const resetTimeSec = Math.ceil((oldestHit + windowMs - now) / 1000);
      res.setHeader('Retry-After', resetTimeSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);

      return res.status(429).json({
        success: false,
        message,
        retryAfter: resetTimeSec,
      });
    }

    timestamps.push(now);
    hits.set(ip, timestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length));

    next();
  };
};

// Rate limiter for authentication routes (prevent credential brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login/register attempts per 15 min
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

// Rate limiter for abuse-sensitive report generation
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: 'Too many report submissions. Please wait a few minutes before submitting another report.',
});

module.exports = {
  rateLimit,
  authLimiter,
  reportLimiter,
};
