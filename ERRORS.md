# ERRORS.md - Error Tracking & Learning Log

## [2026-08-03 16:35] - Validation 400 Error on POST /questions/export

- **Type**: Validation / Logic Error
- **Severity**: Medium
- **File**: `backend/src/questions/dto/question.dto.ts` & `frontend/app/question-bank/page.tsx`
- **Agent**: @backend-specialist & @debugger
- **Root Cause**: When no filters were selected on the frontend, empty string values (`""`) were sent in the `POST /questions/export` request payload (`{ subjectId: "", chapterId: "", type: "" }`). Phía backend Class Validator checked these fields as non-empty values (because `""` is not `undefined`), causing `subjectId must not be less than 1`, `chapterId must be a UUID`, etc.
- **Error Message**:

  ```json
  Status 400 - Error: {"message":["subjectId must not be less than 1","chapterId must be a UUID","type must be one of..."]}
  ```

- **Fix Applied**:
  1. Added `@Transform(({ value }) => (value === '' || value === null ? undefined : value))` to all filter properties in `QuestionQueryDto` so backend gracefully converts empty strings to `undefined` before validation.
  2. Filtered out empty strings `""` from payload in frontend `exportCsv` before dispatching `POST /questions/export`.
- **Prevention**: Always sanitize filter objects before sending payloads and use `@Transform` in DTOs to coerce empty strings to `undefined`.
- **Status**: Fixed

---

## [2026-08-04 13:00] - Database Schema Mismatch (Missing Migration for Online Exam Config)

- **Type**: Integration / Database Error
- **Severity**: High
- **File**: `backend/prisma/schema.prisma` & `backend/prisma/migrations/20260804060200_add_online_exam_access_control`
- **Agent**: @backend-specialist & @exam
- **Root Cause**: Schema was updated with 7 new online exam security fields (`accessCode`, `ipWhitelist`, `lateEntryWindowMinutes`, `maxAttempts`, `requireDeviceBinding`, `requireRulesAcceptance`, `rulesAcceptedAt`), but no Prisma migration had been executed to add these columns to the PostgreSQL database tables (`online_exam_configs`, `exam_attempts`).
- **Error Message**:
  ```txt
  PrismaClientKnownRequestError: The column `online_exam_configs.accessCode` does not exist in the current database.
  ```
- **Fix Applied**: 
  1. Created migration SQL `20260804060200_add_online_exam_access_control/migration.sql` with `ALTER TABLE` statements.
  2. Executed SQL migration on PostgreSQL via `prisma db execute`.
  3. Regenerated Prisma Client with `npx prisma generate`.
- **Prevention**: Always generate and apply a Prisma migration immediately after modifying `schema.prisma`.
- **Status**: Fixed


---

## [2026-08-05 07:55] - Garbled Vietnamese Font Characters in Exported CSV Files (MS Excel)

- **Type**: Integration / Encoding Error
- **Severity**: Medium
- **File**: `frontend/lib/export-csv.ts`, `frontend/app/*`, `frontend/components/ExcelImportModal.tsx`
- **Agent**: @frontend-specialist & @exam
- **Root Cause**: Downloaded `.csv` files were generated without a UTF-8 Byte Order Mark (`\uFEFF` BOM) prefix. When Microsoft Excel opens CSV files without a BOM, it defaults to opening them in ANSI/CP1252 character encoding, corrupting Vietnamese UTF-8 text (e.g. `Tên Kỳ thi` rendered as `TĂªn Ká»³ thi`).
- **Error Message**:
  ```txt
  Corrupted font rendering in Excel: TĂªn Ká»³ thi, Há»c ká»³, NÄƒm há»c, NgÃ y báº¯t đầu, TrÃ¡ºng thÃ¡i
  ```
- **Fix Applied**:
  1. Created centralized utility `frontend/lib/export-csv.ts` that prepends `\uFEFF` (UTF-8 BOM) to CSV string streams before Blob creation.
  2. Refactored all 13 export pages and CSV sample template downloads to use `downloadCsv`.
- **Prevention**: Always prepend `\uFEFF` UTF-8 BOM when generating CSV or HTML file downloads targeting Microsoft Office applications.
- **Status**: Fixed

---
