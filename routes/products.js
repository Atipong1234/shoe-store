const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/products -> รายการสินค้าทั้งหมด พร้อมรูปหลัก (รูปแรก)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*,
        (SELECT image_url FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS cover_image
      FROM products p
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'โหลดสินค้าไม่สำเร็จ' });
  }
});

// GET /api/products/:id -> รายละเอียดสินค้า + รูปทั้งหมด
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }
    const imagesRes = await pool.query(
      'SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC, id ASC',
      [id]
    );
    res.json({ ...productRes.rows[0], images: imagesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'โหลดรายละเอียดสินค้าไม่สำเร็จ' });
  }
});

module.exports = router;
