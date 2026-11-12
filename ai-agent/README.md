# SOES AI Agent

Private LangChain/LangGraph service. The TypeScript backend validates user roles and release rules before sending aggregate evidence. The service must not be exposed directly to browsers or mobile apps.

Install Python 3.12 or 3.13, then from this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
python -m pytest
python -m uvicorn soes_agent.main:app --host 127.0.0.1 --port 8001
```

Set `AI_AGENT_SHARED_SECRET` to the same high-entropy value in the backend and this service. Set `GOOGLE_API_KEY` or `GEMINI_API_KEY` only in the private agent environment. Configure `AI_AGENT_MODEL` to select a supported model. Keep these values out of Git.

The student material flow uses the existing course enrollment access rule. The backend allows a student to select one PDF, DOCX, or UTF-8 TXT file already visible in their enrolled class, up to 3 MiB. The agent reads at most 20,000 characters and requires a valid material citation in its answer. Scanned PDFs without extractable text are unsupported. The teacher's `aiEnabled` material flag remains reserved for teacher question generation. Material-based study suggestions never imply that a hidden exam was graded or analyzed.

Practice generation uses the same selected material and rejects drafts without an exact source quote or with duplicate options. A generated set is stored separately from official exam attempts; the backend grades one submission using a one-time database claim. Answers and explanations are returned only after submission. Generation is limited to ten sets per student per rolling 24 hours. Model-generated questions still need quality evaluation against real course content before production use.
