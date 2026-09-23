const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ตั้งค่าที่เก็บไฟล์อัปโหลด
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB ต่อไฟล์
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'));
    }
    cb(null, true);
  }
});

// ทุก route ในไฟล์นี้ต้องล็อกอินเป็นแอดมินก่อน
router.use(requireAuth);

// POST /api/admin/upload -> อัปโหลดรูปภาพ (หลายไฟล์) คืนค่า url กลับไป
router.post('/upload', upload.array('images', 10), (req, res) => {
  const urls = (req.files || []).map(f => `/uploads/${f.filename}`);
  res.json({ urls });
});

// POST /api/admin/products -> เพิ่มสินค้าใหม่ (พร้อมรายการ url รูปภาพ)
router.post('/products', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, brand, description, price, stock, images } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อสินค้าและราคา' });
    }

    await client.query('BEGIN');
    const productRes = await client.query(
      `INSERT INTO products (name, brand, description, price, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, brand || null, description || null, price, stock || 0]
    );
    const product = productRes.rows[0];

    const imgList = Array.isArray(images) ? images : [];
    for (let i = 0; i < imgList.length; i++) {
      await client.query(
        'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
        [product.id, imgList[i], i]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'เพิ่มสินค้าไม่สำเร็จ' });
  } finally {
    client.release();
  }
});

// PUT /api/admin/products/:id -> แก้ไขสินค้า (แทนที่รูปภาพทั้งหมดถ้ามีการส่ง images มา)
router.put('/products/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, brand, description, price, stock, images } = req.body;

    await client.query('BEGIN');
    const updateRes = await client.query(
      `UPDATE products SET name=$1, brand=$2, description=$3, price=$4, stock=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, brand || null, description || null, price, stock || 0, id]
    );
    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }

    if (Array.isArray(images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (let i = 0; i < images.length; i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [id, images[i], i]
        );
      }
    }

    await client.query('COMMIT');
    res.json(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'แก้ไขสินค้าไม่สำเร็จ' });
  } finally {
    client.release();
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ลบสินค้าไม่สำเร็จ' });
  }
});

module.exports = router;
