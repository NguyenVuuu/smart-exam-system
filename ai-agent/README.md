# SOES AI Agent

Private LangChain/LangGraph service. The TypeScript backend validates user roles and release rules before sending aggregate evidence. The service must not be exposed directly to browsers or mobile apps.

Install Python 3.12 or 3.13, then from this directory:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
python -m pytest
python -m uvicorn soes_agent.main:app --host 127.0.0.1 --port 8001
```

Set `AI_AGENT_SHARED_SECRET` to the same high-entropy value in the backend and this service. Set `GOOGLE_API_KEY` or `GEMINI_API_KEY` only in the private agent environment. The default model is `gemini-3.6-flash`, which passed local response and structured practice checks with the current provider account. `AI_AGENT_MODEL=gemini-3.5-flash` is a tested fallback for basic responses. Keep these values out of Git.

Before starting the application, apply the backend migrations from `be/soes-be` with `npx prisma migrate deploy`. The backend must have `AI_AGENT_ENABLED=true`, `AI_AGENT_URL=http://127.0.0.1:8001`, and the same `AI_AGENT_SHARED_SECRET` as the Python process. Keep the Python service listening on localhost or a private network. Restart the backend after changing its environment. The model provider must be configured separately; installing Python and LangChain alone does not enable AI responses.

The agent limits provider calls to 50 seconds and the backend request to 60 seconds by default. Check `/health` locally before trying the UI. Provider availability and quotas still depend on the configured account.

The student material flow uses the existing course enrollment access rule. The backend allows a student to select one PDF, DOCX, or UTF-8 TXT file already visible in their enrolled class, up to 3 MiB. The agent reads at most 20,000 characters and requires a valid material citation in its answer. Scanned PDFs without extractable text are unsupported. The teacher's `aiEnabled` material flag remains reserved for teacher question generation. Material-based study suggestions never imply that a hidden exam was graded or analyzed.

Practice generation uses the same selected material and rejects drafts without an exact source quote or with duplicate options. A generated set is stored separately from official exam attempts; the backend grades one submission using a one-time database claim. Answers and explanations are returned only after submission. Generation is limited to ten sets per student per rolling 24 hours. Model-generated questions still need quality evaluation against real course content before production use.
