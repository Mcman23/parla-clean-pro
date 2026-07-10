const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'parla-secret-key-change-me';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tələb olunur' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token etibarsızdır' });
  }
}

module.exports = authMiddleware;
