const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;

const userAuth = (req, res, next) => {  
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = userAuth;