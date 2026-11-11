# Admin Multiple Roles Implementation Plan

**Goal:** Allow one account to hold student, teacher, and education officer roles from the admin user form, with administrator exclusive.

**Architecture:** Keep one User with one username and password. Create the selected Student, Teacher, and Education Officer profiles in the same database transaction. Add a guarded endpoint for attaching a missing role to an existing account; preserve existing roles. Fetch admin rows by role so a multi-role account appears in each corresponding tab.

**Tech Stack:** Express, Prisma, Zod, React, TypeScript.

## Tasks

1. Extend create validation with an optional `roles` array, accepting student, teacher, and education officer together while keeping administrator exclusive. Validate teacher department and admin authorization. Add a focused validator test.
2. Update repository create transaction to write `User.roles` and each selected profile. Add a transaction-backed repository method for attaching one missing student, teacher, or education officer role to an existing account.
3. Add a permission-protected role attachment API with checks for account existence, duplicate role, department, and code collisions.
4. Update admin types, API, and user hook. Fetch each role's rows for the tabs; expose the shared user ID and attach-role action.
5. Change the create form to select student, teacher, and education officer together, with department shown for teacher. In edit mode, show the roles already held and an action to add a missing eligible role.
6. Run backend and frontend typechecks, focused tests, and inspect the diff to keep unrelated workspace files untouched.
