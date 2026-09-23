const grid = document.getElementById('product-grid');
const loading = document.getElementById('loading');
const overlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

async function loadProducts() {
  try {
    console.log('กำลังเรียก API /api/products');

    const res = await fetch('/api/products');

    console.log('API status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error ${res.status}: ${text}`);
    }

    const products = await res.json();

    console.log('Products:', products);

    loading.classList.add('hidden');

    if (!Array.isArray(products)) {
      throw new Error('API ไม่ได้ส่งข้อมูลเป็น Array');
    }

    if (products.length === 0) {
      grid.innerHTML = '<p>ยังไม่มีสินค้าในระบบ</p>';
      return;
    }

    grid.innerHTML = products.map(p => `
      <div class="card" data-id="${p.id}">
        <img 
          src="${p.cover_image || 'https://via.placeholder.com/300x200?text=No+Image'}" 
          alt="${escapeHtml(p.name)}"
        >

        <div class="card-body">
          <p class="card-name">${escapeHtml(p.name)}</p>
          <p class="card-brand">${escapeHtml(p.brand || '')}</p>
          <p class="card-price">
            ฿${Number(p.price).toLocaleString()}
          </p>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        openProduct(card.dataset.id);
      });
    });

  } catch (err) {
    console.error('โหลดสินค้าไม่สำเร็จ:', err);

    loading.textContent = `โหลดสินค้าไม่สำเร็จ: ${err.message}`;
  }
}


async function openProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);

    if (!res.ok) {
      throw new Error(`ไม่สามารถโหลดสินค้าได้ (${res.status})`);
    }

    const p = await res.json();

    document.getElementById('modal-name').textContent = p.name;
    document.getElementById('modal-brand').textContent = p.brand || '';

    document.getElementById('modal-price').textContent =
      `฿${Number(p.price).toLocaleString()}`;

    document.getElementById('modal-stock').textContent =
      `คงเหลือ: ${p.stock} คู่`;

    document.getElementById('modal-desc').textContent =
      p.description || '';

    // =========================
    // รูปภาพสินค้า
    // =========================

    const images = p.images && p.images.length
      ? p.images
      : [
          {
            image_url: 'https://via.placeholder.com/500x400?text=No+Image'
          }
        ];

    const mainImg = document.getElementById('modal-main-image');
    const modal = document.querySelector('.modal');

    // รูปแรก
    mainImg.src = images[0].image_url;

    // รีเซ็ตขนาด
    mainImg.classList.remove('image-large');
    modal.classList.remove('image-zoomed');

    // =========================
    // กดรูปหลัก = ขยาย
    // =========================

    mainImg.onclick = () => {
      mainImg.classList.toggle('image-large');
      modal.classList.toggle('image-zoomed');
    };

    // =========================
    // Thumbnail
    // =========================

    const thumbs = document.getElementById('modal-thumbs');

    thumbs.innerHTML = images.map((img, i) => `
      <img
        src="${img.image_url}"
        class="${i === 0 ? 'active' : ''}"
        data-src="${img.image_url}"
        alt="${escapeHtml(p.name)}"
      >
    `).join('');

    thumbs.querySelectorAll('img').forEach(thumb => {

      thumb.addEventListener('click', () => {

        // เปลี่ยนรูป
        mainImg.src = thumb.dataset.src;

        // กลับเป็นขนาดปกติ
        mainImg.classList.remove('image-large');
        modal.classList.remove('image-zoomed');

        // เปลี่ยน active
        thumbs.querySelectorAll('img').forEach(t => {
          t.classList.remove('active');
        });

        thumb.classList.add('active');
      });

    });

    // เปิด Modal
    overlay.classList.remove('hidden');

  } catch (err) {
    console.error('เปิดรายละเอียดสินค้าไม่สำเร็จ:', err);
  }
}

// =========================
// ปุ่มปิด Modal
// =========================

modalClose.addEventListener('click', () => {
  overlay.classList.add('hidden');
});


// =========================
// คลิกพื้นหลังเพื่อปิด
// =========================

overlay.addEventListener('click', (e) => {

  if (e.target === overlay) {
    overlay.classList.add('hidden');
  }

});


// =========================
// ป้องกัน HTML แปลก ๆ
// =========================

function escapeHtml(str) {
  const div = document.createElement('div');

  div.textContent = str || '';

  return div.innerHTML;
}


// =========================
// เริ่มโหลดสินค้า
// =========================

loadProducts();