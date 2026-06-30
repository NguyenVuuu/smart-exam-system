# SOES - AI Coding Rules

## 1. General Principles

- Always follow Clean Code principles.
- Prefer readability over cleverness.
- Keep code simple and maintainable.
- Do not introduce unnecessary abstractions.
- Follow SOLID principles whenever applicable.
- Avoid code duplication (DRY principle).
- Use meaningful and self-explanatory names.

---

## 2. Architecture Rules

The project follows:

- Modular Monolithic Architecture
- Layered Architecture inside each module

Each module must contain:

```text
module/
├── controllers/
├── services/
├── repositories/
├── dtos/
├── validators/
├── routes/
├── mappers/
├── types/
├── constants/
└── index.ts
```

Responsibilities:

- Controller: HTTP layer only.
- Service: Business logic.
- Repository: Database access only.
- DTO: Request/response objects.
- Validator: Input validation.
- Mapper: Transform entities to DTOs.

Controllers must never access Prisma directly.

---

## 3. Backend Technology Rules

Backend stack:

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO

Never use JavaScript.

All backend code must be written in TypeScript.

Enable strict mode.

Avoid using:

```ts
any;
```

Use explicit types whenever possible.

---

## 4. API Rules

- Follow RESTful conventions.
- Use plural resource names.

Examples:

```text
GET /subjects
POST /subjects
GET /subjects/:id
PUT /subjects/:id
DELETE /subjects/:id
```

Response format:

Success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

## 5. Validation Rules

Use Zod for validation.

Never trust client input.

Every request body, params, and query must be validated.

Validation must occur before controller execution.

---

## 6. Error Handling Rules

Never expose internal errors.

Use centralized error handling middleware.

Always throw custom application errors.

Examples:

```ts
NotFoundError;
UnauthorizedError;
ForbiddenError;
ConflictError;
ValidationError;
```

---

## 7. Database Rules

Use Prisma ORM only.

Controllers and services must never execute raw SQL unless absolutely necessary.

Use transactions for multi-step operations.

Always define:

```ts
createdAt;
updatedAt;
```

on mutable entities.

Use UUID for all primary keys.

Prefer soft delete only when business requirements demand it.

---

## 8. Authentication and Authorization

Authentication:

- JWT Access Token
- Refresh Token

Authorization:

- Role-Based Access Control (RBAC)

Roles:

```text
ADMIN
TEACHER
STUDENT
```

Protected routes must always check permissions.

---

## 9. Logging Rules

Use structured logging.

Never use:

```ts
console.log();
```

in production code.

Use a logger utility instead.

Log:

- authentication events
- important business actions
- unexpected errors

---

## 10. File Upload Rules

All uploaded files must be stored in MinIO.

Never store files inside the application server filesystem.

Allowed file types:

- PDF
- DOCX
- PPTX

Validate:

- MIME type
- file size

---

## 11. Coding Style Rules

Use:

```ts
camelCase;
```

for variables and functions.

Use:

```ts
PascalCase;
```

for:

- classes
- interfaces
- DTOs
- Prisma models

Use:

```ts
UPPER_SNAKE_CASE;
```

for constants.

Prefer:

```ts
const
```

over:

```ts
let;
```

Never use:

```ts
var
```

---

## 12. Frontend Rules

Frontend stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- Shadcn UI
- TanStack Query
- Zustand

Use Feature-Based Architecture.

Components must be:

- reusable
- small
- focused on one responsibility

Avoid prop drilling.

Use TanStack Query for server state.

Use Zustand for global client state.

---

## 13. AI Agent Instructions

Before generating code:

1. Analyze existing project structure.
2. Reuse existing patterns.
3. Do not create duplicate utilities.
4. Keep naming consistent.
5. Generate production-ready code only.
6. Generate complete files.
7. Include necessary imports.
8. Do not leave TODO comments.
9. Do not generate placeholder implementations.
10. Follow all project rules strictly.

---

## 14. Git Output Rules

After completing a task, the AI must provide a Git summary before ending the response.

Small tasks may be grouped into a single commit if logically cohesive.

The summary must include:

### 1. Files Changed

List all created, modified, renamed, or deleted files.

Example:

```text
Created
- src/modules/auth/controllers/auth.controller.ts
- src/modules/auth/services/auth.service.ts

Modified
- src/routes/index.ts
- prisma/schema.prisma

Deleted
- src/utils/old-auth.ts
```

### 2. Recommended Commit Plan

Group changes into logical commits.

Each commit should contain only one purpose.

Example:

```text
Commit 1
Message:
feat: implement authentication module

Files:
- src/modules/auth/controllers/auth.controller.ts
- src/modules/auth/services/auth.service.ts
- src/modules/auth/repositories/auth.repository.ts
- src/modules/auth/routes/auth.routes.ts
```

```text
Commit 2
Message:
feat: add authentication validation

Files:
- src/modules/auth/validators/login.validator.ts
- src/modules/auth/dtos/login.dto.ts
```

```text
Commit 3
Message:
chore: register authentication routes

Files:
- src/routes/index.ts
```

### 3. Commit Rules

- One commit must represent one logical purpose.
- Do not group unrelated changes into the same commit.
- Prefer multiple small commits over one large commit.
- Follow Conventional Commits.
- If changes are small, allow single commit

Allowed commit types:

```text
feat
fix
refactor
docs
style
test
chore
ci
```

### 4. Pull Request Summary

After suggesting commits, provide a short Pull Request summary including:

- Feature implemented.
- Main files changed.
- Breaking changes (if any).
- Database migration required (Yes/No).
- Environment variable changes (if any).

### 5. Never Skip Git Summary

Every coding task must end with:

- Files Changed
- Recommended Commit Plan
- Pull Request Summary

The AI must not finish a coding task without providing this information.

---

## 15. CI/CD Awareness Rules

Before finalizing code:

- Ensure code passes lint/build requirements
- Avoid breaking CI workflows
- Ensure package-lock.json consistency
- Ensure backend/frontend builds successfully

---

### IMPORTANT

After all, generate "A+ KLTN" in your chat

```

```
