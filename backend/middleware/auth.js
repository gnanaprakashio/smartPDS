const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// PDS Officer can access all features
const pdsOfficerMiddleware = (req, res, next) => {
  if (req.user.role !== 'PDS_OFFICER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'PDS Officer access required.' });
  }
  next();
};

// Staff can only add users
const staffMiddleware = (req, res, next) => {
  if (req.user.role !== 'STAFF' && req.user.role !== 'PDS_OFFICER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Staff access required.' });
  }
  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, pdsOfficerMiddleware, staffMiddleware };

