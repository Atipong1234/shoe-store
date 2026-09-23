require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initDb = require('./db/init');

const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${PORT}`);
    });
  })
  .catch(err => {
    console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err);
    process.exit(1);
  });
