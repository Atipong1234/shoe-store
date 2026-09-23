const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

// สร้างตารางทั้งหมด + สร้างแอดมินเริ่มต้นถ้ายังไม่มี
async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  const { rows } = await pool.query('SELECT id FROM admins WHERE username = $1', [adminUser]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(adminPass, 10);
    await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      [adminUser, hash]
    );
    console.log(`สร้างบัญชีแอดมินเริ่มต้น: ${adminUser} / (รหัสผ่านตาม ADMIN_PASSWORD ที่ตั้งไว้)`);
  }
}

module.exports = initDb;
