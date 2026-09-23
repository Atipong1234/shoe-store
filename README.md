# 👟 Shoe Store — เว็บขายรองเท้าพร้อมระบบแอดมิน

เว็บให้ลูกค้าเลื่อนดูรองเท้า ดูรายละเอียด+รูปภาพหลายรูป+ราคา
และมีระบบล็อกอินแอดมินสำหรับ เพิ่ม/ลบ/แก้ไข สินค้า

Stack: Node.js (Express) + PostgreSQL (Neon) + Docker, พร้อม deploy บน Render

## โครงสร้างโปรเจกต์
```
shoe-store/
├── server.js              # entry point
├── db/                    # schema + connection + init
├── routes/                # products.js (public), auth.js, admin.js (CRUD)
├── middleware/auth.js     # ตรวจสอบ JWT
├── public/                # หน้าเว็บลูกค้า + หน้าแอดมิน
├── uploads/                # ไฟล์รูปที่แอดมินอัปโหลด
├── Dockerfile
├── docker-compose.yml
└── render.yaml
```

## 1. เตรียม Neon Database
1. สมัคร/เข้า https://neon.tech สร้างโปรเจกต์ใหม่
2. คัดลอก Connection String (มีรูปแบบ `postgres://user:pass@host/db?sslmode=require`)
3. เก็บไว้ใช้เป็นค่า `DATABASE_URL`

ไม่ต้องรัน schema.sql เอง — แอปจะสร้างตารางและบัญชีแอดมินเริ่มต้นให้อัตโนมัติตอนสตาร์ทครั้งแรก (ผ่าน `db/init.js`)

## 2. รันด้วย Docker (แนะนำ)
```bash
cp .env.example .env
# แก้ .env ใส่ DATABASE_URL จาก Neon, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

docker compose up --build
```
เปิดเว็บที่ http://localhost:3000
หน้าแอดมิน: http://localhost:3000/admin/login.html

## 3. รันแบบไม่ใช้ Docker (dev)
```bash
npm install
cp .env.example .env   # แล้วแก้ค่า
node server.js
```

## 4. Deploy บน Render
1. Push โค้ดขึ้น GitHub
2. ใน Render กด New > Blueprint แล้วชี้ไปที่ repo (จะอ่าน `render.yaml` อัตโนมัติ)
   หรือสร้าง Web Service ใหม่แบบ Docker เอง แล้วเลือก repo นี้
3. ไปที่ Environment ของ service แล้วกรอกค่า:
   - `DATABASE_URL` = connection string จาก Neon
   - `JWT_SECRET` = ข้อความสุ่มยาวๆ
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` = บัญชีแอดมินที่ต้องการ
4. Render จะ build และ deploy ให้อัตโนมัติ

**หมายเหตุเรื่องรูปภาพ:** `render.yaml` ตั้ง persistent disk ไว้ที่ `/app/uploads` แล้ว
เพื่อให้รูปที่อัปโหลดไม่หายตอน deploy ใหม่ ถ้าต้องการความเสถียรสูงขึ้นในระยะยาว
แนะนำเปลี่ยนไปเก็บรูปที่บริการภายนอกเช่น Cloudinary หรือ AWS S3 แทนการเก็บในดิสก์ของเซิร์ฟเวอร์

## Endpoint หลักๆ
- `GET /api/products` — รายการสินค้า (public)
- `GET /api/products/:id` — รายละเอียด+รูปทั้งหมด (public)
- `POST /api/auth/login` — ล็อกอินแอดมิน คืน JWT token
- `POST /api/admin/upload` — อัปโหลดรูป (ต้องแนบ Bearer token)
- `POST /api/admin/products` — เพิ่มสินค้า (ต้องแนบ Bearer token)
- `PUT /api/admin/products/:id` — แก้ไขสินค้า
- `DELETE /api/admin/products/:id` — ลบสินค้า

## บัญชีแอดมินเริ่มต้น
ถ้าไม่ตั้งค่า ENV จะใช้ `admin / admin123` — **ควรเปลี่ยนก่อนใช้งานจริง** โดยตั้งค่า
`ADMIN_USERNAME` และ `ADMIN_PASSWORD` ก่อนรันครั้งแรก
