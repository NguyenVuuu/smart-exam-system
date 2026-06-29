# 📘 SOES - DATABASE SCHEMA

## 1. Overview

SOES uses **PostgreSQL** as the primary relational database.

The schema is designed to support:

- Academic management
- Online examinations
- AI-assisted question generation
- Automatic grading
- Anti-cheating and proctoring
- Audit and system logging

The design follows a **Modular Monolithic Architecture** and is optimized for extensibility.

---

## 2. Design Principles

- Use UUID as primary keys.
- Normalize relational data (3NF).
- Enforce referential integrity via foreign keys.
- Use ENUM for controlled states.
- Preserve historical data.
- Separate concerns by domain (Academic / Exam / AI / Proctoring).
- Use UTC for all timestamps.

---

## 3. Core Entities Overview

### Identity & Access

- User

### Academic

- Semester
- Subject
- CourseOffering
- Enrollment

### Learning Content

- Material

### Question Bank

- Question
- QuestionOption
- ProgrammingTestCase

### Examination

- Exam
- ExamQuestion
- ExamAttempt
- ExamSession
- StudentAnswer
- ProgrammingSubmission

### Monitoring & Security

- Violation

### System

- Notification
- AuditLog

---

# 4. Identity & User Management

## User

| Field        | Type      | Description               |
| ------------ | --------- | ------------------------- |
| id           | UUID      | Primary key               |
| email        | VARCHAR   | Unique                    |
| password     | VARCHAR   | Hashed password           |
| full_name    | VARCHAR   | Full name                 |
| role         | ENUM      | ADMIN / TEACHER / STUDENT |
| student_code | VARCHAR   | Nullable                  |
| teacher_code | VARCHAR   | Nullable                  |
| avatar_url   | TEXT      | Nullable                  |
| status       | ENUM      | ACTIVE / INACTIVE         |
| created_at   | TIMESTAMP | Created time              |
| updated_at   | TIMESTAMP | Updated time              |

### Constraints

- email must be unique.
- student_code only applies to STUDENT.
- teacher_code only applies to TEACHER.

---

# 5. Academic Domain

## Semester

| Field      | Type    | Description                |
| ---------- | ------- | -------------------------- |
| id         | UUID    | PK                         |
| name       | VARCHAR | Semester name              |
| start_date | DATE    | Start date                 |
| end_date   | DATE    | End date                   |
| status     | ENUM    | UPCOMING / ACTIVE / CLOSED |

---

## Subject

| Field       | Type    | Description       |
| ----------- | ------- | ----------------- |
| id          | UUID    | PK                |
| code        | VARCHAR | Unique            |
| name        | VARCHAR | Subject name      |
| description | TEXT    | Optional          |
| status      | ENUM    | ACTIVE / INACTIVE |

### Constraints

- code must be unique.

---

## CourseOffering

Represents:

> One teacher teaches one subject in one semester.

| Field       | Type             |
| ----------- | ---------------- |
| id          | UUID             |
| code        | VARCHAR          |
| semester_id | UUID (FK)        |
| subject_id  | UUID (FK)        |
| teacher_id  | UUID (FK → User) |
| status      | ENUM             |
| created_at  | TIMESTAMP        |
| updated_at  | TIMESTAMP        |

---

## Enrollment

| Field              | Type      |
| ------------------ | --------- |
| id                 | UUID      |
| course_offering_id | UUID      |
| student_id         | UUID      |
| enrolled_at        | TIMESTAMP |

### Constraints

- (course_offering_id, student_id) UNIQUE

---

# 6. Learning Materials

## Material

| Field              | Type      |
| ------------------ | --------- |
| id                 | UUID      |
| course_offering_id | UUID      |
| uploaded_by        | UUID      |
| file_name          | VARCHAR   |
| object_name        | VARCHAR   |
| file_size          | BIGINT    |
| content_type       | VARCHAR   |
| storage_path       | TEXT      |
| ai_enabled         | BOOLEAN   |
| created_at         | TIMESTAMP |
| updated_at         | TIMESTAMP |

### Constraints

- (course_offering_id, file_name) UNIQUE

---

# 7. Question Bank

## Question

| Field       | Type            |
| ----------- | --------------- |
| id          | UUID            |
| owner_id    | UUID            |
| subject_id  | UUID            |
| type        | ENUM            |
| content     | TEXT            |
| explanation | TEXT            |
| difficulty  | ENUM            |
| source      | ENUM            |
| language    | ENUM (nullable) |
| created_at  | TIMESTAMP       |
| updated_at  | TIMESTAMP       |

### Notes

- Questions belong to teachers.
- Questions may be reused across semesters and classes.

---

## QuestionOption

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| question_id | UUID    |
| content     | TEXT    |
| is_correct  | BOOLEAN |

---

## ProgrammingTestCase

| Field           | Type    |
| --------------- | ------- |
| id              | UUID    |
| question_id     | UUID    |
| input           | TEXT    |
| expected_output | TEXT    |
| weight          | DECIMAL |
| is_hidden       | BOOLEAN |

---

# 8. Examination Domain

## Exam

| Field                      | Type               |
| -------------------------- | ------------------ |
| id                         | UUID               |
| course_offering_id         | UUID               |
| created_by                 | UUID               |
| title                      | VARCHAR            |
| description                | TEXT               |
| password                   | VARCHAR (nullable) |
| start_time                 | TIMESTAMP          |
| end_time                   | TIMESTAMP          |
| duration_minutes           | INT                |
| max_attempts               | INT                |
| shuffle_questions          | BOOLEAN            |
| shuffle_options            | BOOLEAN            |
| show_result_immediately    | BOOLEAN            |
| allow_review_before_submit | BOOLEAN            |
| status                     | ENUM               |
| created_at                 | TIMESTAMP          |
| updated_at                 | TIMESTAMP          |

---

## ExamQuestion

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| exam_id     | UUID    |
| question_id | UUID    |
| points      | DECIMAL |

Constraint:

(exam_id, question_id) UNIQUE

Notes:

- This table only stores which questions belong to an exam.
- Question order is generated dynamically when a student starts an exam.

---

## ExamAttemptQuestion

Stores the actual question order for each student attempt.

| Field       | Type |
| ----------- | ---- |
| id          | UUID |
| attempt_id  | UUID |
| question_id | UUID |
| order_index | INT  |

Constraint:

- (attempt_id, question_id) UNIQUE
- (attempt_id, order_index) UNIQUE

---

# 9. Exam Execution

## ExamAttempt

| Field             | Type      |
| ----------------- | --------- |
| id                | UUID      |
| exam_id           | UUID      |
| student_id        | UUID      |
| attempt_no        | INT       |
| started_at        | TIMESTAMP |
| submitted_at      | TIMESTAMP |
| remaining_seconds | INT       |
| last_saved_at     | TIMESTAMP |
| ended_by          | ENUM      |
| status            | ENUM      |
| total_score       | DECIMAL   |
| auto_score        | DECIMAL   |
| manual_score      | DECIMAL   |
| is_published      | BOOLEAN   |

Constraint:

(exam_id, student_id, attempt_no) UNIQUE

---

## ProgrammingSubmission

| Field            | Type      |
| ---------------- | --------- |
| id               | UUID      |
| answer_id        | UUID      |
| language         | ENUM      |
| source_code      | TEXT      |
| execution_result | JSONB     |
| judge0_token     | VARCHAR   |
| created_at       | TIMESTAMP |
| updated_at       | TIMESTAMP |

---

## ExamSession

Stores runtime session information during examination.

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| attempt_id     | UUID      |
| socket_id      | VARCHAR   |
| ip_address     | VARCHAR   |
| device_info    | TEXT      |
| last_heartbeat | TIMESTAMP |
| is_online      | BOOLEAN   |
| created_at     | TIMESTAMP |
| updated_at     | TIMESTAMP |

---

## StudentAnswer

| Field               | Type    |
| ------------------- | ------- |
| id                  | UUID    |
| attempt_id          | UUID    |
| question_id         | UUID    |
| selected_option_ids | JSONB   |
| score               | DECIMAL |
| is_correct          | BOOLEAN |

Constraint:

(attempt_id, question_id) UNIQUE

# 10. Violation

## Violation

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| attempt_id     | UUID      |
| violation_type | ENUM      |
| severity       | ENUM      |
| evidence_urls  | JSONB     |
| description    | TEXT      |
| detected_at    | TIMESTAMP |

---

## Notification

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | VARCHAR   |
| content    | TEXT      |
| is_read    | BOOLEAN   |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## AuditLog

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| user_id     | UUID      |
| action      | VARCHAR   |
| entity_type | VARCHAR   |
| entity_id   | UUID      |
| metadata    | JSONB     |
| created_at  | TIMESTAMP |
| updated_at  | TIMESTAMP |

---

### Notes

- `selected_option_ids` stores selected answers for multiple-choice questions.

Example:

```json
["uuid-option-1", "uuid-option-3"]
```

# 11. ENUM Definitions

## UserRole

- ADMIN
- TEACHER
- STUDENT

## UserStatus

- ACTIVE
- INACTIVE

## SemesterStatus

- UPCOMING
- ACTIVE
- CLOSED

## CourseOfferingStatus

- ACTIVE
- CLOSED

## QuestionType

- SINGLE_CHOICE
- MULTIPLE_CHOICE
- PROGRAMMING

## QuestionDifficulty

- EASY
- MEDIUM
- HARD

## QuestionSource

- MANUAL
- AI_GENERATED
- IMPORTED

## ExamStatus

- DRAFT
- PUBLISHED
- CLOSED

## AttemptStatus

- IN_PROGRESS
- SUBMITTED
- EXPIRED

## AttemptEndedBy

- STUDENT
- TIMEOUT
- SYSTEM

## ViolationType

- TAB_SWITCH
- FULLSCREEN_EXIT
- NO_FACE
- MULTIPLE_FACES
- INACTIVITY

## SeverityLevel

- LOW
- MEDIUM
- HIGH

# 12. Relationship Summary

User (Teacher) 1 -> N CourseOffering
User (Student) N <-> N CourseOffering via Enrollment
Semester 1 -> N CourseOffering
Subject 1 -> N CourseOffering
CourseOffering 1 -> N Material
User (Teacher) 1 -> N Question
Subject 1 -> N Question
CourseOffering 1 -> N Exam
User (Teacher) 1 -> N Exam
Exam 1 -> N ExamQuestion
Question 1 -> N ExamQuestion
Exam 1 -> N ExamAttempt
User (Student) 1 -> N ExamAttempt
ExamAttempt 1 -> N ExamAttemptQuestion
Question 1 -> N ExamAttemptQuestion
ExamAttempt 1 -> N StudentAnswer
Question 1 -> N StudentAnswer
StudentAnswer 1 -> N ProgrammingSubmission
Question 1 -> N QuestionOption
Question 1 -> N ProgrammingTestCase
ExamAttempt 1 -> N ExamSession
ExamAttempt 1 -> N Violation
User 1 -> N Notification
User 1 -> N AuditLog

## General Conventions

- All primary keys use UUID.
- All timestamps are stored in UTC.
- All tables should include foreign key constraints.
- Cascade delete should be carefully configured.
- Soft delete may be implemented in the future using `deleted_at`.
