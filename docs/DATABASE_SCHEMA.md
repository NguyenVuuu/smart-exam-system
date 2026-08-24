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
- Post and material management

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

### AI Generation

- AIGenerationHistory
- AIGenerationMaterial

### Question Bank

- Question
- QuestionOption
- ProgrammingTestCase
- ProgrammingSubmission
- ProgrammingSubmissionTestResult
- ProgrammingQuestionConfig

### Examination

- Exam
- ExamType (ENUM)
- ExamCreationMethod (ENUM)
- ExamQuestion
- ExamQuestionOption
- ExamAttempt
- ExamAttemptQuestion
- ExamSession
- StudentAnswer

### Monitoring & Security

- Violation
- ProgrammingSubmission (includes programming submissions and test results)
- ProgrammingTestCase
- ProgrammingQuestionConfig

### System

- Notification
- AuditLog

---

# 4. Identity & User Management

## User

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique |
| phone_number | VARCHAR | Optional |
| full_name | VARCHAR | Full name |
| avatar_url | TEXT | Optional |
| created_at | TIMESTAMP | Created time |
| updated_at | TIMESTAMP | Updated time |

## Teacher

| Field | Type |
|-|-|
| id | UUID |
| teacher_code | VARCHAR |
| password | VARCHAR |
| status | ENUM |
| user_id | UUID |

## Student

| Field | Type |
|-|-|
| id | UUID |
| student_code | VARCHAR |
| password | VARCHAR |
| status | ENUM |
| user_id | UUID |

## Admin

| Field | Type |
|-|-|
| id | UUID |
| admin_code | VARCHAR |
| password | VARCHAR |
| status | ENUM |
| user_id | UUID |

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

### Source Meaning

MANUAL:
- Teacher manually creates question
AI_GENERATED:
- Generated by AI from selected learning materials
IMPORTED:
- Imported from external source

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

# 7A. AIQuestionGeneration
## AIQuestionGeneration
| Field                      | Type               |
| -------------------------- | ------------------ |
| id                         | UUID               |
| course_offering_id         | UUID               |
| created_by                 | UUID               |
| prompt                     | VARCHAR            |
| model                      | TEXT               |
| requested_count            | INT                |
| generated_count            | INT                |
| status                     | ENUM               |
| created_at                 | TIMESTAMP          |
| updated_at                 | TIMESTAMP          |
| completed_at               | TIMESTAMP          |
| error_message              | VARCHAR            |

## AIQuestionGenerationMaterial

| Field                      | Type               |
| -------------------------- | ------------------ |
| id                         | UUID               |
| generation_id              | UUID               |
| material_id                | UUID               |

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
| result_published           | BOOLEAN            |
| result_published_at        | TIMESTAMP          |
| status                     | ENUM               |
| type                       | ENUM               |
| creation_method            | ENUM               |
| require_fullscreen         | BOOLEAN            |
| enable_webcam              | BOOLEAN            |
| block_copy_paste           | BOOLEAN            |
| block_right_click          | BOOLEAN            |
| published_at               | TIMESTAMP          |
| created_at                 | TIMESTAMP          |
| updated_at                 | TIMESTAMP          |

## ExamType

## Exam Creation Method

Determines how exam questions are created.
Values:
- MANUAL
- QUESTION_BANK
- AI_GENERATED
- MIXED
---

## ExamType

Values:
- QUIZ
- MIDTERM
- FINAL

---

## Exam Creation Method

Determines how exam questions are created.
Values:
- MANUAL
- QUESTION_BANK
- AI_GENERATED
- MIXED

---

## ExamQuestion

| Field              | Type               |
| ------------------ | ------------------ |
| id                 | UUID               |
| exam_id            | UUID               |
| order_index        | INT                |
| points             | DECIMAL            |
| content            | TEXT               |
| explanation        | TEXT               |
| type               | ENUM               |
| difficulty         | ENUM               |
| language           | ENUM (nullable)    |
| source_question_id | UUID (nullable)    |

---

## ExamAttemptQuestion

Stores the actual question order for each student attempt.

| Field             | Type       |
| ----------------- | ---------- |
| id                | UUID       |
| attempt_id        | UUID       |
| exam_question_id  | UUID       |
| display_order     | INT        |
| shuffled_option_ids | JSONB    |

Constraint:

- (attempt_id, exam_question_id) UNIQUE
- (attempt_id, display_order) UNIQUE

### Notes

- `display_order` is the position of the question in this specific attempt (1-based).
- `shuffled_option_ids` stores the randomized order of option IDs for this attempt. Các ID được xáo trộn nếu `exam.shuffleOptions = true`.

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
| attempt_end_at    | TIMESTAMP |
| submitted_at      | TIMESTAMP |
| remaining_seconds | INT       |
| last_saved_at     | TIMESTAMP |
| ended_by          | ENUM      |
| status            | ENUM      |
| total_score       | DECIMAL   |
| auto_score        | DECIMAL   |
| manual_score      | DECIMAL   |

Constraint:

(exam_id, student_id, attempt_no) UNIQUE

### Notes

- `attempt_end_at` là authoritative deadline được lưu khi tạo attempt. Giá trị này được tính từ `min(started_at + duration_minutes, exam.endTime)` tại thời điểm start và KHÔNG được cập nhật sau đó.
- `remaining_seconds` là snapshot từ thời điểm start exam, không được cập nhật sau đó. Clients phải tính lại `remaining_seconds` dựa trên thời gian hiện tại: `max(0, floor((attempt_end_at - now) / 1000))`.
- `shuffled_option_ids` trong `ExamAttemptQuestion` lưu thứ tự đã xáo trộn của các option ID cho từng câu hỏi trong từng attempt.
- Không có field `is_published` trong ExamAttempt. Kết quả được kiểm tra qua `Exam.result_published`.

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
| exam_question_id    | UUID    |
| selected_option_ids | JSONB   |
| draft_source_code   | TEXT    |
| score               | DECIMAL |
| is_correct          | BOOLEAN |

Constraint:

(attempt_id, exam_question_id) UNIQUE

### Notes

- `selected_option_ids` stores selected answers for multiple-choice questions.
- `draft_source_code` stores student's programming code during the exam (before submission).

Constraint:

(attempt_id, exam_question_id) UNIQUE

---

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
ExamQuestion 1 -> N ExamAttemptQuestion
ExamQuestion 1 -> N ExamQuestionOption
ExamAttempt 1 -> N StudentAnswer
ExamQuestion 1 -> N StudentAnswer
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
