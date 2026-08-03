---
description: Kiểm tra mã nguồn và quy trình làm việc theo 4 tiêu chí cốt lõi của Andrej Karpathy để đảm bảo an toàn, tối giản và thực nghiệm.
---

# /karpathy-audit - Review Code Against Karpathy Guidelines

$ARGUMENTS

---

## 🟢 PHASE 1: Surgical Scope Check
**Agent**: `explorer-agent`
**Mission**: Audit the current `git diff` or recently touched files to ensure no scope creep or drive-by refactoring.
- **Checklist**:
  - Were changes strictly isolated to requested features?
  - Are there any unrelated refactoring or style-formatting cleanups in other functions/files?
  - Did we preserve original docstrings, comments, and structure?

## 🟡 PHASE 2: Simplicity Audit
**Agent**: `quality-inspector`
**Mission**: Detect over-engineering and speculative abstractions in new code.
- **Checklist**:
  - Are there any generic design patterns, abstract classes, or interfaces that aren't strictly required?
  - Is the code as direct and readable as possible?
  - Can any multi-layered utility functions be collapsed into simpler functional code?

## 🔵 PHASE 3: Context & Assumptions Check
**Agent**: `orchestrator`
**Mission**: Ensure the agent did not code based on silent, unverified assumptions.
- **Checklist**:
  - Were all external APIs, credentials, or DB structures verified in active code/config before writing?
  - Did the agent clarify ambiguities with the user before committing to major decisions?

## 🔴 PHASE 4: Empirical Verification
**Agent**: `test-engineer`
**Mission**: Verify that changes are fully covered by tests and proven functional.
- **Checklist**:
  - Are there unit or integration tests verifying the exact changes?
  - Run the test suite: `pytest` or target test files.
  - Check log output to verify success (no warning, no silent failures).

---

## Key Principles:
- **Evidence-Based Success**: We only trust code that runs and passes tests. No "it should work."
- **Strict Scope**: Keep changes localized. Don't touch working code that was not requested.
