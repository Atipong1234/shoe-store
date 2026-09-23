const token = localStorage.getItem('admin_token');
if (!token) {
  window.location.href = '/admin/login.html';
}

document.getElementById('who').textContent = localStorage.getItem('admin_username') || '';

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  window.location.href = '/admin/login.html';
});

const form = document.getElementById('product-form');
const errorEl = document.getElementById('error');
const preview = document.getElementById('preview');
const imagesInput = document.getElementById('images');
const cancelEditBtn = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');

let currentImageUrls = []; // รูปที่มีอยู่แล้ว (ตอนแก้ไข) หรือรูปที่อัปโหลดใหม่

imagesInput.addEventListener('change', () => {
  preview.innerHTML = '';
  Array.from(imagesInput.files).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });
});

async function authFetch(url, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${token}`
  };
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login.html';
    throw new Error('unauthorized');
  }
  return res;
}

async function uploadImagesIfAny() {
  if (imagesInput.files.length === 0) return [];
  const fd = new FormData();
  Array.from(imagesInput.files).forEach(f => fd.append('images', f));
  const res = await authFetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'อัปโหลดรูปไม่สำเร็จ');
  return data.urls;
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const tbody = document.getElementById('product-table-body');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img class="thumb-small" src="${p.cover_image || 'https://via.placeholder.com/50'}"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.brand || '-')}</td>
      <td>฿${Number(p.price).toLocaleString()}</td>
      <td>${p.stock}</td>
      <td class="row-actions">
        <button class="btn btn-secondary" onclick="editProduct(${p.id})">แก้ไข</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">ลบ</button>
      </td>
    </tr>
  `).join('');
}

async function editProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();
  document.getElementById('product-id').value = p.id;
  document.getElementById('name').value = p.name;
  document.getElementById('brand').value = p.brand || '';
  document.getElementById('price').value = p.price;
  document.getElementById('stock').value = p.stock;
  document.getElementById('description').value = p.description || '';
  currentImageUrls = p.images.map(img => img.image_url);
  preview.innerHTML = currentImageUrls.map(u => `<img src="${u}">`).join('');
  imagesInput.value = '';
  formTitle.textContent = `แก้ไขสินค้า: ${p.name}`;
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  if (!confirm('ยืนยันลบสินค้านี้?')) return;
  const res = await authFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
  if (res.ok) loadProducts();
  else alert('ลบไม่สำเร็จ');
}

cancelEditBtn.addEventListener('click', () => {
  form.reset();
  document.getElementById('product-id').value = '';
  currentImageUrls = [];
  preview.innerHTML = '';
  formTitle.textContent = 'เพิ่มสินค้าใหม่';
  cancelEditBtn.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.style.display = 'none';

  const id = document.getElementById('product-id').value;
  const payload = {
    name: document.getElementById('name').value,
    brand: document.getElementById('brand').value,
    price: parseFloat(document.getElementById('price').value),
    stock: parseInt(document.getElementById('stock').value || '0', 10),
    description: document.getElementById('description').value,
  };

  try {
    let newUrls = [];
    if (imagesInput.files.length > 0) {
      newUrls = await uploadImagesIfAny();
    }
    // ถ้าแก้ไขและมีรูปเดิม + อัปโหลดรูปใหม่เพิ่ม -> รวมกัน; ถ้าเพิ่มสินค้าใหม่ใช้รูปที่อัปโหลด
    payload.images = id ? [...currentImageUrls, ...newUrls] : newUrls;

    let res;
    if (id) {
      res = await authFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await authFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'บันทึกไม่สำเร็จ';
      errorEl.style.display = 'block';
      return;
    }

    form.reset();
    document.getElementById('product-id').value = '';
    currentImageUrls = [];
    preview.innerHTML = '';
    formTitle.textContent = 'เพิ่มสินค้าใหม่';
    cancelEditBtn.style.display = 'none';
    loadProducts();
  } catch (err) {
    errorEl.textContent = err.message || 'เกิดข้อผิดพลาด';
    errorEl.style.display = 'block';
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

loadProducts();
