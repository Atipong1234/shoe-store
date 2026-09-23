const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function changeAdminPassword() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const newPassword = process.env.ADMIN_PASSWORD;

    if (!newPassword) {
      throw new Error('ไม่พบ ADMIN_PASSWORD ใน .env');
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE admins SET password_hash = $1 WHERE username = $2',
      [hash, username]
    );

    if (result.rowCount === 0) {
      console.log(`ไม่พบแอดมิน username: ${username}`);
    } else {
      console.log(`เปลี่ยนรหัสผ่านแอดมิน ${username} สำเร็จ`);
    }
  } catch (err) {
    console.error('เปลี่ยนรหัสผ่านไม่สำเร็จ:', err);
  } finally {
    await pool.end();
  }
}

changeAdminPassword();