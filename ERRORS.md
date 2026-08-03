# ERRORS.md - Error Tracking & Learning Log

## [2026-08-03 16:35] - Validation 400 Error on POST /questions/export

- **Type**: Validation / Logic Error
- **Severity**: Medium
- **File**: `backend/src/questions/dto/question.dto.ts` & `frontend/app/question-bank/page.tsx`
- **Agent**: @backend-specialist & @debugger
- **Root Cause**: When no filters were selected on the frontend, empty string values (`""`) were sent in the `POST /questions/export` request payload (`{ subjectId: "", chapterId: "", type: "" }`). Phía backend Class Validator checked these fields as non-empty values (because `""` is not `undefined`), causing `subjectId must not be less than 1`, `chapterId must be a UUID`, etc.
- **Error Message**:
  ```
  Status 400 - Error: {"message":["subjectId must not be less than 1","chapterId must be a UUID","type must be one of..."]}
  ```
- **Fix Applied**: 
  1. Added `@Transform(({ value }) => (value === '' || value === null ? undefined : value))` to all filter properties in `QuestionQueryDto` so backend gracefully converts empty strings to `undefined` before validation.
  2. Filtered out empty strings `""` from payload in frontend `exportCsv` before dispatching `POST /questions/export`.
- **Prevention**: Always sanitize filter objects before sending payloads and use `@Transform` in DTOs to coerce empty strings to `undefined`.
- **Status**: Fixed

---
