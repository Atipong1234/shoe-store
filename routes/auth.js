const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอก username และ password' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'username หรือ password ไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'dev-secret-change-me',
      { expiresIn: '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
  }
});

module.exports = router;
