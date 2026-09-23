const jwt = require('jsonwebtoken');

// ตรวจสอบ JWT token จาก header Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'ไม่ได้ล็อกอิน (ไม่มี token)' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'token ไม่ถูกต้องหรือหมดอายุ' });
  }
}

module.exports = requireAuth;
