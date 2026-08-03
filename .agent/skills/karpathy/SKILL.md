---
version: 4.1.0-fractal
name: karpathy
description: Principal coding guidelines by Andrej Karpathy to prevent LLM hallucination, over-engineering, and unsafe refactoring.
category: tools
layer: master-skill
---

# Andrej Karpathy AI Coding Skill

This skill enforces strict discipline on AI coding agents, targeting the four most common failure modes: silent assumptions, over-engineering, scope creep, and lack of real verification.

---

## 🧠 1. THINK BEFORE CODING (No Silent Assumptions)
*   **Pitfall:** AI writing code based on half-understood requirements or assumptions about DB schemas/APIs.
*   **Instruction:** If there is any ambiguity, **STOP**. Ask 3-5 targeted questions before writing code. State your planned approach and key assumptions in the response.

### Before/After Example:
*❌ Bad (Assumes API shape and codes silently):*
```python
# User: "Integrate the TTS API"
# Agent starts coding immediately, assuming the endpoint accepts JSON directly and returns an audio URL.
import requests

def speak(text):
    response = requests.post("https://api.tts.service/speak", json={"text": text})
    return response.json()["url"]
```

*✅ Karpathy Way (Stops to clarify or checks code/config first):*
```
"I need to integrate the TTS API. Before coding, I must check:
 1. Do we have credentials configured in `.env`?
 2. Does the API return raw audio bytes or a URL?
 3. Which client library is already in requirements.txt?
Let me check the codebase first..."
```

---

## 🛡️ 2. KEEP IT SIMPLE (Anti Over-Engineering)
*   **Pitfall:** Writing generic frameworks, helper classes, or future-proof abstractions when a simple function is enough.
*   **Instruction:** Write minimal code. Do not write abstractions unless explicitly requested.

### Before/After Example:
*❌ Bad (Speculative abstractions):*
```python
# User: "Send a notification"
class NotificationProvider(ABC):
    @abstractmethod
    def send(self, recipient, message): pass

class EmailNotificationProvider(NotificationProvider):
    def send(self, recipient, message):
        # send email...
        pass
```

*✅ Karpathy Way (Minimalist, direct function):*
```python
def send_email_notification(email: str, message: str):
    # send email directly using standard smtp or config client...
    pass
```

---

## 🎯 3. MAKE SURGICAL CHANGES (No Scope Creep)
*   **Pitfall:** AI refactoring unrelated methods, changing code styles, or modifying files outside the task scope.
*   **Instruction:** Only edit the lines/files directly required for the change. Preserve all original docstrings and comments.

### Before/After Example:
*❌ Bad (Cleaning up unrelated code):*
```diff
# Modifying User Registration, but AI also changes unrelated formatting in auth.py:
-def get_user_status(user_id):
-    return db.query(Status).filter(Status.user_id == user_id).first()
+def get_user_status(user_id: int) -> Optional[Status]:
+    """Fetches user status from db."""
+    return db.query(Status).filter_by(user_id=user_id).first()
```

*✅ Karpathy Way (Surgical, untouched unrelated code):*
Keep `get_user_status` exactly as it is, and only apply changes to the user registration endpoint/function.

---

## 🧪 4. DEFINE AND VERIFY SUCCESS (Mandatory Verification)
*   **Pitfall:** Declaring a task complete without running the code or checking execution output.
*   **Instruction:** Always run tests, compile code, or execute scripts. Output results as evidence.

### Verification Checklist:
1. Write unit/integration tests for the new functionality.
2. Run the tests via command line (e.g. `pytest tests/test_feature.py`).
3. Ensure no lint errors or type check warnings.
4. Show the exact test execution output.
