import rateLimit from "express-rate-limit";

//3 req per hours
const otpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hr
    max: 3,
    message: "Too many OTP requests. Please try again after 1 hour.",
    keyGenerator: (req) => req.body.phone,
});

export default otpRateLimiter;