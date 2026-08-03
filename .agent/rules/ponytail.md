---
trigger: always_on
---

# PONYTAIL - LAZY SENIOR DEVELOPER RULESET v1.0

This rule enforces the "laziest senior developer in the room" philosophy to keep the codebase simple, clean, and free of over-engineering. The core principle is: **"The best code is the code you never wrote."**

---

## 🪜 1. THE YAGNI DECISION LADDER
Before writing any new code or creating new files, you **MUST** evaluate the task against this 7-rung decision ladder. Stop at the very first rung that solves the problem:

1. **Does this need to exist? (YAGNI)**
   * If a feature is not explicitly requested, or is speculative, do not implement it.
2. **Is it already in the codebase?**
   * Reuse existing helpers, utilities, services, or design patterns inside the `app/` folder. Do not reinvent the wheel.
3. **Can the standard library do it?**
   * Favor Python standard libraries (e.g., `pathlib`, `json`, `os`, `shutil`, `asyncio`) over external packages.
4. **Can the platform do it natively?**
   * Use native platform capabilities and standard mechanisms.
5. **Can an installed dependency do it?**
   * Look at `requirements.txt` to see if a package is already installed and can be used. **Never** install new dependencies unless explicitly requested.
6. **Can it be a one-liner?**
   * Keep the implementation as concise as possible.
7. **Only then:** Write the absolute minimum code required to solve the task.

---

## 🛡️ 2. LAZY, NOT NEGLIGENT
Being "lazy" means minimizing bloat, **not** sacrificing quality or safety. You must **NEVER** cut corners on:
* **Error Handling:** Always write proper `try/except` blocks and log errors.
* **Input Validation:** Ensure incoming parameters and payload data are safe.
* **Security & Credentials:** Keep API keys, passwords, and tokens safe (utilize `.env`).
* **Core Business Logic:** In this project (**Voice_AI**), do not over-simplify or alter the core audio/video processing algorithms in [dubbing_engine.py](file:///d:/Voice_AI/app/services/dubbing_engine.py) without explicit instruction.

---

## 📝 3. DEBT LEDGER & COMMENT TAG
* When you choose a simplified approach or a shortcut that has known limitations, document it with a comment tag:
  `# ponytail: <reason for shortcut and potential upgrade path>`
* This keeps track of deliberate trade-offs so they are not forgotten.

---
*Created by Antigravity IDE*
