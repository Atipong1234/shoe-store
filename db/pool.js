const { Pool } = require('pg');

// Neon ต้องใช้ SSL เสมอ ส่วน Postgres ที่รันเอง (Docker local) ไม่ต้องใช้ SSL
// ตรวจจากตัว connection string เอง หรือบังคับด้วย PGSSL=true/false ก็ได้
const connStr = process.env.DATABASE_URL || '';
let useSSL = /neon\.tech|sslmode=require/i.test(connStr);
if (process.env.PGSSL === 'true') useSSL = true;
if (process.env.PGSSL === 'false') useSSL = false;

const pool = new Pool({
  connectionString: connStr,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

module.exports = pool;