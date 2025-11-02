# Book Management System

ระบบจัดการห้องสมุดที่ใช้ Express.js + TypeScript + MongoDB สำหรับการยืม-คืนหนังสือ พร้อมระบบสิทธิ์การใช้งานแบบหลายระดับ

## 🚀 Features

- ✅ **Authentication & Authorization** - JWT-based authentication พร้อม role-based access control
- ✅ **User Management** - จัดการผู้ใช้ 3 ระดับ: normal_user, librarian, admin
- ✅ **Book Management** - CRUD operations พร้อม filters, pagination และ status management
- ✅ **Borrowing System** - ยืม-คืนหนังสือ พร้อมคำนวณค่าปรับอัตโนมัติ
- ✅ **Type Safety** - TypeScript strict mode ไม่มี `any`
- ✅ **TDD** - Unit tests พร้อม mocking สำหรับทุก service

## 📋 Tech Stack

- **Backend**: Express.js 4.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: MongoDB (MongoDB Atlas)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Testing**: Jest + ts-jest
- **Password Hashing**: bcryptjs

## 🏗 Project Structure

```
src/
├─ main.ts                 # Express server entry point
├─ app.module.ts           # Routes & middleware registration
├─ modules/
│   ├─ users/
│   │   ├─ api/            # Routes (auth, user)
│   │   ├─ controller/     # Request/response handling
│   │   ├─ service/        # Business logic
│   │   └─ model/          # Mongoose models
│   └─ books/
│       ├─ api/            # Routes (book, borrow)
│       ├─ controller/     # Request/response handling
│       ├─ service/        # Business logic
│       └─ model/          # Mongoose models
├─ util/
│   ├─ errors.ts           # Custom error classes
│   ├─ errorHandler.ts     # Global error handler
│   ├─ logger.ts           # Logger utility
│   └─ responseWrapper.ts  # Standardized responses
├─ config/
│   ├─ env.ts              # Environment variables
│   └─ db.ts               # MongoDB connection
├─ middleware/
│   ├─ auth.middleware.ts  # JWT authentication
│   └─ role.middleware.ts  # Role-based access
└─ types/
    ├─ user.types.ts
    ├─ book.types.ts
    ├─ borrowing.types.ts
    ├─ common.types.ts
    └─ express.d.ts        # Express type extensions
```

## 📦 Installation

1. Clone repository และติดตั้ง dependencies:
```bash
npm install
```

2. สร้างไฟล์ `.env` (ใช้ค่าจาก `.env.example` หรือตามที่กำหนดไว้):
```env
PORT=3000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

LATE_FEE_PER_DAY=10
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build
npm run build

# Start
npm start
```

### Type Checking
```bash
npm run type-check
```

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test src/modules/users/service/auth.service.test.ts

# Watch mode
npm test -- --watch
```

## 📚 API Endpoints

### Authentication (`/auth`)

- `POST /auth/register` - สมัครสมาชิก
- `POST /auth/login` - เข้าสู่ระบบ

### User Management (`/users`)

- `GET /users` - ดูรายการผู้ใช้ทั้งหมด (admin only)
- `PATCH /users/:userId/role` - เปลี่ยน role (admin only)
- `PATCH /users/:userId/employment-status` - เปลี่ยนสถานะการจ้างงาน (admin only)

### Book Management (`/bookshelf`)

- `GET /bookshelf` - ดูรายการหนังสือทั้งหมด (support filters & pagination)
- `GET /bookshelf/:bookId` - ดูรายละเอียดหนังสือ
- `POST /bookshelf` - เพิ่มหนังสือ (admin only)
- `PATCH /bookshelf/:bookId/status` - อัปเดตสถานะหนังสือ (librarian, admin)
- `DELETE /bookshelf/:bookId` - ลบหนังสือ (admin only)

### Borrowing System

- `POST /bookshelf/:bookId/borrow` - ยืมหนังสือ (authenticated users)
- `POST /bookshelf/:bookId/return` - คืนหนังสือ (authenticated users)
- `GET /borrowing/history` - ดูประวัติการยืม
- `PATCH /borrowing/:borrowId/approve` - อนุมัติการยืม (librarian, admin)

## 👥 User Roles

### 1. normal_user (ผู้ใช้ทั่วไป)
- ดูรายการหนังสือ
- ยืม-คืนหนังสือ
- ดูประวัติการยืมของตนเอง

### 2. librarian (บรรณารักษ์)
- สิทธิ์ทั้งหมดของ normal_user
- อนุมัติการยืมหนังสือ
- อัปเดตสถานะหนังสือ (available, borrowed, damaged)
- ดูประวัติการยืมทั้งหมด

### 3. admin (ผู้ดูแลระบบ)
- สิทธิ์ทั้งหมดของ librarian
- จัดการผู้ใช้งาน (CRUD, role management)
- เพิ่ม/ลบหนังสือ
- เปลี่ยนสถานะหนังสือได้ทุกอย่าง

## 🧪 Testing Strategy

โปรเจกต์นี้ใช้ **Test-Driven Development (TDD)**:

1. เขียน test cases ก่อน (Red Phase)
2. Implement code เพื่อให้ tests ผ่าน (Green Phase)
3. Refactor code (Refactor Phase)

### Test Coverage
- ✅ Auth Service (5 tests)
- ✅ User Service (10 tests)
- ✅ Auth Middleware (4 tests)
- ✅ Role Middleware (5 tests)
- ✅ Book Service (tests written)
- ✅ Borrow Service (tests written)

## 🔒 Security Features

- Password hashing ด้วย bcryptjs
- JWT-based authentication
- Role-based authorization
- Input validation ด้วย Zod
- CORS enabled
- Environment variables สำหรับ sensitive data

## 📝 Business Rules

### Borrowing Rules
- ผู้ใช้สามารถยืมได้สูงสุด **5 เล่ม** พร้อมกัน
- ระยะเวลายืม default: **14 วัน**
- ค่าปรับคืนหนังสือช้า: **10 บาท/วัน** (configurable)
- หนังสือต้องมีสถานะ `available` เท่านั้นถึงจะยืมได้

### Book Status Transitions
- `importing` → `available` (admin)
- `available` → `borrowed` (auto on borrow)
- `borrowed` → `available` (auto on return)
- `borrowed` → `damaged` (on damaged return)
- Any status → `lost` (admin only)

## 🎯 Code Quality Standards

- ✅ TypeScript strict mode
- ✅ ไม่ใช้ `any` type
- ✅ Type guards แทน type assertions
- ✅ แยก layers ชัดเจน (Model, Service, Controller, Route)
- ✅ Custom error classes
- ✅ Standardized response format
- ✅ Comprehensive error handling
- ✅ Database indexing สำหรับ performance

## 📄 License

MIT

## 👨‍💻 Author

Created for Cursor AI development

---

**สร้างเมื่อ**: 2025-10-18

สำหรับรายละเอียดเพิ่มเติม โปรดดู [requirement/Book-Project/book-project.md](requirement/Book-Project/book-project.md)




test merge