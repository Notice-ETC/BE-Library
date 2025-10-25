# Book Management System - Project Requirements

## 📚 Overview
ระบบจัดการห้องสมุดที่ใช้ Express.js + TypeScript + MongoDB สำหรับการยืม-คืนหนังสือ พร้อมระบบสิทธิ์การใช้งานแบบหลายระดับ

---

## 🛠 Tech Stack
- **Backend**: Express.js with TypeScript
- **Database**: MongoDB
- **Authentication**: JWT (recommended)
- **Validation**: Express-validator / Zod (recommended)

---

## 📁 Project Structure

```
src/
 ├─ main.ts                 # จุดเริ่มต้นของแอป (Express server)
 ├─ app.module.ts           # รวม modules ทั้งหมด
 ├─ modules/
 │   ├─ users/
 │   │   ├─ api/
 │   │   │   ├─ user.route.ts
 │   │   │   └─ auth.route.ts
 │   │   ├─ controller/
 │   │   │   ├─ user.controller.ts
 │   │   │   └─ auth.controller.ts
 │   │   ├─ service/
 │   │   │   ├─ user.service.ts
 │   │   │   └─ auth.service.ts
 │   │   └─ model/
 │   │       └─ user.model.ts
 │   └─ books/
 │       ├─ api/
 │       │   └─ book.route.ts
 │       ├─ controller/
 │       │   └─ book.controller.ts
 │       ├─ service/
 │       │   └─ book.service.ts
 │       └─ model/
 │           └─ book.model.ts
 ├─ util/
 │   ├─ logger.ts
 │   ├─ errorHandler.ts
 │   └─ responseWrapper.ts
 ├─ config/
 │   ├─ env.ts
 │   └─ db.ts
 └─ middleware/
     ├─ auth.middleware.ts
     └─ role.middleware.ts
```

---

## 👥 User Roles & Permissions

### 1. **normal_user** (ผู้ใช้ทั่วไป)
- ดูรายการหนังสือที่มีอยู่
- ยืมหนังสือ (เมื่อสถานะ = `available`)
- คืนหนังสือที่ยืมไป
- ดูประวัติการยืมของตนเอง

### 2. **librarian** (บรรณารักษ์)
- สิทธิ์ทั้งหมดของ `normal_user`
- อนุมัติการยืมหนังสือ
- อัปเดตสถานะการยืม-คืน
- เปลี่ยนสถานะหนังสือ:
  - `available` ↔ `borrowed`
  - `borrowed` → `damaged`
  - ไม่สามารถลบหนังสือได้

### 3. **admin** (ผู้ดูแลระบบ)
- สิทธิ์ทั้งหมดของ `librarian`
- จัดการผู้ใช้งาน (CRUD)
- ลบหนังสือออกจากระบบ
- เปลี่ยนสถานะหนังสือได้ทุกอย่าง
- จัดการสถานะพนักงาน:
  - `employed` (ทำงานอยู่)
  - `unemployed` (ลาออก/ถูกไล่ออก)
  - `vacation` (ลาพักร้อน)

---

## 📖 Book Status (สถานะหนังสือ)

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| `available` | อยู่บนชั้น พร้อมให้ยืม | librarian, admin |
| `borrowed` | ถูกยืมไปแล้ว | librarian (auto), admin |
| `damaged` | ชำรุด ไม่สามารถยืมได้ | librarian, admin |
| `importing` | กำลังนำเข้า ยังไม่พร้อมใช้งาน | admin |
| `lost` | สูญหาย ไม่มีในระบบแล้ว | admin |

---

## 🔐 Authentication Endpoints

### POST `/auth/register`
**สมัครสมาชิกใหม่**

**Request Body:**
```typescript
{
  username: string;
  email: string;
  password: string;
  fullName: string;
}
```

**Response:**
```typescript
{
  success: true,
  message: "User registered successfully",
  data: {
    userId: string;
    username: string;
    email: string;
    role: "normal_user" // default role
  }
}
```

---

### POST `/auth/login`
**เข้าสู่ระบบ**

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: true,
  message: "Login successful",
  data: {
    token: string; // JWT token
    user: {
      userId: string;
      username: string;
      email: string;
      role: "normal_user" | "librarian" | "admin";
      employmentStatus?: "employed" | "unemployed" | "vacation"; // สำหรับ librarian/admin
    }
  }
}
```

---

## 📚 Book Management Endpoints

### GET `/bookshelf`
**แสดงรายการหนังสือทั้งหมด (พร้อม Filter)**

**Query Parameters:**
- `title` (string): ค้นหาจากชื่อหนังสือ (partial match)
- `author` (string): ค้นหาจากชื่อผู้แต่ง
- `status` (string): กรองตามสถานะ (`available`, `borrowed`, `damaged`, `importing`, `lost`)
- `category` (string): หมวดหมู่หนังสือ (เช่น fiction, science, history)
- `pageCount` (number): จำนวนหน้า (สามารถใช้ `minPages`, `maxPages`)
- `page` (number): หน้าปัจจุบัน (pagination)
- `limit` (number): จำนวนรายการต่อหน้า

**Example:**
```
GET /bookshelf?status=available&category=fiction&page=1&limit=10
```

**Response:**
```typescript
{
  success: true,
  data: {
    books: [
      {
        _id: string;
        title: string;
        author: string;
        isbn: string;
        category: string;
        pageCount: number;
        status: "available" | "borrowed" | "damaged" | "importing" | "lost";
        publishedYear: number;
        borrowedBy?: string; // userId (if status = borrowed)
        borrowedAt?: Date;
        dueDate?: Date;
        createdAt: Date;
        updatedAt: Date;
      }
    ],
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    }
  }
}
```

**Authorization:** ทุก role สามารถเข้าถึงได้

---

### GET `/bookshelf/:bookId`
**ดูรายละเอียดหนังสือเล่มเดียว**

**Response:** เหมือน GET `/bookshelf` แต่ return เฉพาะหนังสือเล่มเดียว

---

### POST `/bookshelf`
**เพิ่มหนังสือเข้าระบบ**

**Request Body:**
```typescript
{
  title: string;
  author: string;
  isbn: string;
  category: string;
  pageCount: number;
  publishedYear: number;
  status?: "available" | "importing"; // default: "importing"
  quantity?: number; // จำนวนที่นำเข้า (ถ้ามีหลายเล่ม)
}
```

**Authorization:** `admin` only

---

### PATCH `/bookshelf/:bookId/status`
**อัปเดตสถานะหนังสือ**

**Request Body:**
```typescript
{
  status: "available" | "borrowed" | "damaged" | "importing" | "lost";
  reason?: string; // เหตุผล (optional, แนะนำสำหรับ damaged/lost)
}
```

**Authorization:**
- `librarian`: สามารถเปลี่ยนเป็น `available`, `borrowed`, `damaged` เท่านั้น
- `admin`: สามารถเปลี่ยนได้ทุกสถานะ

---

### DELETE `/bookshelf/:bookId`
**ลบหนังสือออกจากระบบ**

**Authorization:** `admin` only

---

## 📝 Borrowing System Endpoints

### POST `/bookshelf/:bookId/borrow`
**ยืมหนังสือ**

**Request Body:**
```typescript
{
  durationDays?: number; // ระยะเวลายืม (default: 14 วัน)
}
```

**Business Rules:**
- หนังสือต้องมีสถานะ `available`
- ผู้ใช้ไม่สามารถยืมหนังสือเล่มเดียวกันซ้ำได้
- ผู้ใช้สามารถยืมได้สูงสุด 5 เล่มพร้อมกัน

**Response:**
```typescript
{
  success: true,
  message: "Book borrowed successfully",
  data: {
    borrowId: string;
    bookId: string;
    userId: string;
    borrowedAt: Date;
    dueDate: Date;
    status: "pending" | "approved"; // pending สำหรับ normal_user
  }
}
```

**Authorization:** ทุก role

---

### POST `/bookshelf/:bookId/return`
**คืนหนังสือ**

**Request Body:**
```typescript
{
  condition?: "good" | "damaged"; // สภาพหนังสือตอนคืน
  notes?: string;
}
```

**Response:**
```typescript
{
  success: true,
  message: "Book returned successfully",
  data: {
    returnedAt: Date;
    lateFee?: number; // ค่าปรับ (ถ้าคืนเกินกำหนด)
    daysLate?: number;
  }
}
```

**Authorization:** ผู้ยืมเท่านั้น หรือ `librarian`, `admin`

---

### GET `/borrowing/history`
**ดูประวัติการยืม**

**Query Parameters:**
- `userId` (string): ดูประวัติของ user อื่น (admin/librarian only)
- `status` (string): `active`, `returned`, `overdue`

**Response:**
```typescript
{
  success: true,
  data: [
    {
      borrowId: string;
      book: {
        _id: string;
        title: string;
        author: string;
      };
      borrowedAt: Date;
      dueDate: Date;
      returnedAt?: Date;
      status: "active" | "returned" | "overdue";
      lateFee?: number;
    }
  ]
}
```

**Authorization:**
- `normal_user`: ดูได้เฉพาะของตัวเอง
- `librarian`, `admin`: ดูได้ทุกคน

---

### PATCH `/borrowing/:borrowId/approve`
**อนุมัติการยืม (สำหรับ librarian/admin)**

**Authorization:** `librarian`, `admin`

---

## 👤 User Management Endpoints

### GET `/users`
**ดูรายการผู้ใช้ทั้งหมด**

**Query Parameters:**
- `role` (string): กรองตาม role
- `employmentStatus` (string): สำหรับ librarian/admin

**Authorization:** `admin` only

---

### PATCH `/users/:userId/role`
**เปลี่ยน Role ของผู้ใช้**

**Request Body:**
```typescript
{
  role: "normal_user" | "librarian" | "admin";
}
```

**Authorization:** `admin` only

---

### PATCH `/users/:userId/employment-status`
**เปลี่ยนสถานะการจ้างงาน (สำหรับ librarian/admin)**

**Request Body:**
```typescript
{
  employmentStatus: "employed" | "unemployed" | "vacation";
}
```

**Authorization:** `admin` only

---

## 🗄 Database Models

### User Model (TUser)
```typescript
interface TUser {
  _id: ObjectId;
  username: string;
  email: string;
  password: string; // hashed
  fullName: string;
  role: "normal_user" | "librarian" | "admin";
  employmentStatus?: "employed" | "unemployed" | "vacation"; // สำหรับ librarian/admin
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Book Model (TBook)
```typescript
interface TBook {
  _id: ObjectId;
  title: string;
  author: string;
  isbn: string;
  category: string;
  pageCount: number;
  publishedYear: number;
  status: "available" | "borrowed" | "damaged" | "importing" | "lost";
  borrowedBy?: ObjectId; // userId
  borrowedAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### Borrowing Record Model (TBorrowRecord)
```typescript
interface TBorrowRecord {
  _id: ObjectId;
  bookId: ObjectId;
  userId: ObjectId;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  status: "pending" | "approved" | "active" | "returned" | "overdue";
  approvedBy?: ObjectId; // librarian/admin userId
  condition?: "good" | "damaged";
  lateFee?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🛡 Middleware Requirements

### 1. **auth.middleware.ts**
- ตรวจสอบ JWT token
- Attach `req.user` (userId, role, email)
- Return 401 ถ้าไม่มี token หรือ token หมดอายุ

### 2. **role.middleware.ts**
- ตรวจสอบสิทธิ์ตาม role
- รองรับการส่ง array of roles: `requireRole(['librarian', 'admin'])`
- Return 403 ถ้าไม่มีสิทธิ์

---

## 🧰 Utility Requirements

### 1. **logger.ts**
- Log request/response
- Log errors พร้อม timestamp
- แยก log level: `info`, `warn`, `error`

### 2. **errorHandler.ts**
- Global error handler middleware
- จัดการ error types:
  - ValidationError → 400
  - UnauthorizedError → 401
  - ForbiddenError → 403
  - NotFoundError → 404
  - InternalServerError → 500

### 3. **responseWrapper.ts**
- Standardized response format:
```typescript
{
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    code: string;
    details?: any;
  }
}
```

---

## 🔧 Configuration Requirements

### 1. **env.ts**
- Load environment variables
- Required variables:
  - `PORT`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `NODE_ENV`

### 2. **db.ts**
- MongoDB connection setup
- Mongoose configuration
- Connection error handling
- Graceful shutdown

---

## ✅ Additional Requirements

### Type Safety
- ใช้ TypeScript อย่างเข้มงวด (`strict: true`)
- สร้าง type definitions สำหรับ:
  - Request/Response objects
  - Database models
  - Service function parameters
  - API responses

### Validation
- Validate input ทุก endpoint
- ตรวจสอบ:
  - Required fields
  - Data types
  - Format (email, ISBN, etc.)
  - Business rules

### Error Handling
- Try-catch ใน controller layer
- Custom error classes
- Meaningful error messages
- Never expose sensitive info

### Security
- Hash passwords (bcrypt)
- JWT for authentication
- Rate limiting (optional)
- Input sanitization
- CORS configuration

---

## 📦 Recommended Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## 🚀 Development Workflow

1. **Setup Phase**
   - Initialize TypeScript project
   - Install dependencies
   - Configure MongoDB
   - Setup environment variables

2. **Development Phase**
   - Implement models
   - Create middleware
   - Build services
   - Implement controllers
   - Setup routes
   - Connect in app.module.ts

3. **Testing Phase**
   - Test authentication flow
   - Test CRUD operations
   - Test role-based access
   - Test edge cases

4. **Documentation Phase**
   - API documentation
   - Setup instructions
   - Usage examples

---

## 📌 Notes

- **Type Safety คำถาม**: เมื่อ query จาก MongoDB ควรใช้ type assertion เช่น:
  ```typescript
  const book = await BookModel.findById(id) as TBook; // ไม่รวม _id ใน type
  // หรือ
  const book = await BookModel.findById(id).lean(); // return plain object
  ```
  แนะนำสร้าง interface แยกระหว่าง:
  - `TBookDocument` (มี _id และ Mongoose methods)
  - `TBook` (plain object ไม่รวม _id สำหรับ business logic)

- **Employment Status**: ใช้งานเฉพาะกับ `librarian` และ `admin` role เท่านั้น

- **Borrow Limits**: 
  - จำนวนเล่มสูงสุดที่ยืมพร้อมกัน: 5 เล่ม
  - ระยะเวลายืม default: 14 วัน
  - ค่าปรับ: 10 บาท/วัน (configurable)

---

**Created for**: Cursor AI development
**Last Updated**: 2025-10-18