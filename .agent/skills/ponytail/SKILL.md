---
version: 4.1.0-fractal
name: ponytail
description: Multi-rung decision ladder for minimalist code implementation and YAGNI principle enforcement.
category: tools
layer: master-skill
---

# Ponytail REST-AND-RESTRAINT Skill

This skill guides the AI to write minimalist, clean, and robust code by adhering to the "lazy senior developer" philosophy.

---

## 🪜 1. THE YAGNI DECISION LADDER
Before implementing any logic, pause and evaluate the task against the 7-rung decision ladder. Stop at the first rung that solves the task:

1. **Does this need to exist? (YAGNI)**
   * If a feature is not explicitly requested, do not write it.
2. **Is it already in the codebase?**
   * Reuse helpers, services, and modules inside the `app/` folder.
3. **Can the standard library do it?**
   * Favor standard Python packages over external dependencies (e.g. `pathlib`, `json`, `os`, `shutil`, `asyncio`).
4. **Can the platform do it natively?**
   * Use native system command capabilities if appropriate.
5. **Can an installed dependency do it?**
   * Check `requirements.txt`. Do not install new dependencies.
6. **Can it be a one-liner?**
   * Keep functions and returns as short and direct as possible.
7. **Only then:** Write the absolute minimum code required to solve the task.

---

## 🛡️ 2. QUALITY AND SAFETY CRITICALS
Restraint does **NOT** mean negligence. You must **NEVER** cut corners on:
* **Error Boundary & Exception Handling:** Always write appropriate `try/except` blocks and log errors.
* **Input Validation:** Ensure user-provided data is validated before processing.
* **Security & Secrets:** Never expose credentials. Use environment variables via `.env`.
* **Core Core Processing:** Never simplify the audio processing and celery tasks inside `app/services/dubbing_engine.py` without explicit permission.

---

## 📝 3. EXAMPLES: OVER-ENGINEERED VS. PONYTAIL CODE

### Example 1: Creating a File Path and Writing JSON
*❌ Over-engineered (Complex, Custom Helpers):*
```python
class FileManagerHelper:
    def __init__(self, directory):
        self.directory = directory
        if not os.path.exists(directory):
            os.makedirs(directory)
            
    def write_json_data(self, filename, data):
        path = os.path.join(self.directory, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(json.dumps(data, indent=4))
        return path
```

*✅ Ponytail Way (Simple, Stdlib):*
```python
from pathlib import Path
import json

def write_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=4), encoding='utf-8')
```

### Example 2: Checking if a Service is Healthy
*❌ Over-engineered (Over-abstracted):*
```python
class HealthCheckService:
    def __init__(self, db_session):
        self.db = db_session
        
    def check_connection(self):
        try:
            self.db.execute("SELECT 1")
            return {"status": "healthy", "code": 200}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e), "code": 500}
```

*✅ Ponytail Way (Direct, Functional):*
```python
def check_db_health(db) -> bool:
    try:
        db.execute("SELECT 1")
        return True
    except Exception:
        logger.exception("Database health check failed")
        return False
```

---

## ⚙️ 4. DEBT LEDGER
When choosing a simple path that has known limitations, document the shortcut in the code:
`# ponytail: <reason for shortcut and potential upgrade path>`
