const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret';

const userAuth = (req, res, next) => {  
    // Check if user is authenticated via Passport session (OAuth)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    // Check for JWT token
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ message: 'Forbidden - Invalid token' });
    }
};

module.exports = userAuth;