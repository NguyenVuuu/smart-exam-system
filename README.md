# SOES - Smart Online Examination System

SOES là hệ thống thi trực tuyến thông minh gồm backend Express/TypeScript và frontend React/Vite. Code hiện tại tập trung vào ba vai trò `ADMIN`, `TEACHER`, `STUDENT`, hỗ trợ quản lý học vụ, ngân hàng câu hỏi, sinh câu hỏi bằng AI, tổ chức ca thi, giám sát realtime, chấm bài trắc nghiệm/lập trình và công bố kết quả.

## Cấu trúc repo

```text
.
├── be/soes-be        # Backend Express, Prisma, Socket.IO
├── fe/soes-fe        # Frontend React, Vite, Tailwind CSS
├── docs              # Tài liệu kiến trúc, nghiệp vụ, schema, workflow
└── docker-compose.yml
```

## Công nghệ chính

- Backend: Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO, Zod.
- Frontend: React 19, Vite 8, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, Axios, Socket.IO Client, Monaco Editor, MediaPipe Tasks Vision.
- Tích hợp: Gemini AI, Judge0 CE, MinIO, Supabase Storage.

## Chạy môi trường local

1. Chạy hạ tầng:

```bash
docker compose up -d
```

Docker Compose hiện khởi tạo PostgreSQL, Redis, MinIO và Judge0. Frontend/backend chạy bằng script riêng trong từng thư mục.

2. Cài backend:

```bash
cd be/soes-be
npm install
cp .env.example .env
npm run prisma:generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

3. Cài frontend:

```bash
cd fe/soes-fe
npm install
cp .env.example .env
npm run dev
```

Mặc định frontend gọi API qua `VITE_API_URL=http://localhost:3000/api`.

## Tài liệu quan trọng

- [Project Context](docs/PROJECT_CONTEXT.md)
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Teacher Features And Workflows](docs/TEACHER_FEATURES_AND_WORKFLOWS.md)
- [Realtime Proctoring Implementation](docs/REALTIME_PROCTORING_IMPLEMENTATION.md)
- [Backend API docs](be/soes-be/docs)

## Scripts chính

Backend (`be/soes-be`):

- `npm run dev`: chạy API bằng `ts-node` và `nodemon`.
- `npm run build`: build TypeScript.
- `npm run prisma:generate`: sinh Prisma Client.

Frontend (`fe/soes-fe`):

- `npm run dev`: chạy Vite dev server.
- `npm run build`: type-check và build production.
- `npm run lint`: lint frontend.
- `npm run test:vision`: test worker giám sát webcam.
- `npm run test:vision:browser`: chạy Playwright cho luồng vision.

## Ghi chú triển khai

- PostgreSQL là nguồn dữ liệu chính.
- Redis dùng cho refresh token, blacklist token, Socket.IO adapter và live proctoring session state.
- MinIO dùng cho bằng chứng gian lận/proctoring evidence.
- Supabase Storage dùng cho tài liệu học tập, ảnh câu hỏi, file nguồn AI và system assets.
- Judge0 CE dùng để chạy/chấm câu hỏi lập trình.
