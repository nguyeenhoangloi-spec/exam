---
description: Quét và phát hiện các đoạn code thừa, phức tạp hóa (over-engineering) và đề xuất tối giản hóa theo chuẩn Ponytail.
---

# /ponytail-audit - Hunt for Over-Engineering

$ARGUMENTS

---

## 🟢 PHASE 1: Codebase Scan & Reconnaissance
**Agent**: `explorer-agent`
**Mission**: Identify potential areas of over-engineering, unused code, or redundant dependencies.
- **Actions**:
  - Scan python files in `app/` and `tests/` for complex abstractions, excessive helper classes, or unused imports.
  - Review `requirements.txt` for dependencies that can be replaced by Python standard libraries.

## 🟡 PHASE 2: YAGNI Ladder Evaluation
**Agent**: `quality-inspector`
**Mission**: Evaluate suspect code against the Ponytail 7-rung decision ladder.
- **Ladder Steps**:
  1. Does this feature/code absolutely need to exist? (YAGNI)
  2. Is there already a helper or function in the codebase that does this?
  3. Can Python's standard library (`pathlib`, `json`, `os`, `shutil`, `asyncio`) solve it?
  4. Can native platform capabilities handle it?
  5. Can an currently installed dependency handle it without adding new packages?
  6. Can it be written as a one-liner or simplified significantly?

## 🔵 PHASE 3: Safety Guardrails Check
**Agent**: `security-auditor`
**Mission**: Ensure simplification does not compromise critical systems.
- **Checklist**:
  - Do NOT remove input validation or exception handling (`try-except` blocks).
  - Do NOT compromise credentials/API key management (`.env`).
  - Do NOT over-simplify the core algorithms in [dubbing_engine.py](file:///d:/Voice_AI/app/services/dubbing_engine.py).

## 🔴 PHASE 4: Simplification Report
**Agent**: `quality-inspector`
**Mission**: Generate a clean diff/report showing where code can be simplified.
- **Report Format**:
  - File path & line range.
  - Current implementation vs. Proposed minimalist version.
  - Estimated line reduction and complexity reduction.
  - Actionable plan to apply changes safely.

---

## Key Principles:
- **Clean Over Clever**: Favor direct, readable code over complex design patterns.
- **Standard First**: Prioritize the standard library over external dependencies.
- **Document Shortcuts**: Mark applied shortcuts with `# ponytail: <reason>` comments.
