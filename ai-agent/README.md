# SOES AI Agent

Private LangChain/LangGraph service. The TypeScript backend validates user roles and release rules before sending aggregate evidence. The service must not be exposed directly to browsers or mobile apps.

Install Python 3.12 or 3.13. For local development, run the configuration helper once from the repository root. It copies the existing backend Gemini key into the ignored `ai-agent/.env`, generates a shared secret, and enables the backend client without printing secrets:

```powershell
./ai-agent/scripts/configure-local.ps1
```

The helper preserves an existing shared secret and is safe to rerun after a backend key change. The two `.env` files are ignored by Git. Start the private agent in its own terminal from `ai-agent`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
python -m pytest
python -m uvicorn soes_agent.main:app --host 127.0.0.1 --port 8001
```

The service loads `ai-agent/.env` on startup. In a second terminal, start the backend from `be/soes-be` with `npm run dev`, then start the web or mobile client as usual. Restart both services after changing their `.env` files. Check `http://127.0.0.1:8001/health`; it should respond with `{"status":"ok"}`. If a student or teacher request returns 503, verify that both services are running and that the backend and agent have the same shared secret.

Run `python scripts/smoke-local.py` from `ai-agent` to check the authenticated HTTP path with synthetic topic data. Add `--practice` to also test one generated practice draft. The script prints only pass messages; the server log records endpoint, status, elapsed time, and model, without prompts or credentials. A 503 means the provider is temporarily unavailable or its quota is exhausted; the agent cannot make more requests until the provider allows them.

Set `AI_AGENT_SHARED_SECRET` to the same high-entropy value in the backend and this service. Set `GOOGLE_API_KEY` or `GEMINI_API_KEY` only in the private agent environment. The default model is `gemini-3.5-flash`, which passed all four synthetic insight cases locally. Model availability and output quality can change; compare candidates with `python evals/run.py` before switching. Keep secrets out of Git.

Before starting the application, apply the backend migrations from `be/soes-be` with `npx prisma migrate deploy`. The backend must have `AI_AGENT_ENABLED=true`, `AI_AGENT_URL=http://127.0.0.1:8001`, and the same `AI_AGENT_SHARED_SECRET` as the Python process. Keep the Python service listening on localhost or a private network. The model provider must be configured separately; installing Python and LangChain alone does not enable AI responses.

The agent limits provider calls to 50 seconds and the backend request to 60 seconds by default. Check `/health` locally before trying the UI. Provider availability and quotas still depend on the configured account.

The student material flow uses the existing course enrollment access rule. The backend allows a student to select one PDF, DOCX, or UTF-8 TXT file already visible in their enrolled class, up to 3 MiB. The agent reads at most 20,000 characters and requires a valid material citation in its answer. Scanned PDFs without extractable text are unsupported. The teacher's `aiEnabled` material flag remains reserved for teacher question generation. Material-based study suggestions never imply that a hidden exam was graded or analyzed.

Practice generation uses the same selected material and rejects drafts without an exact source quote or with duplicate options. A generated set is stored separately from official exam attempts; the backend grades one submission using a one-time database claim. Answers and explanations are returned only after submission. Generation is limited to ten sets per student per rolling 24 hours. Model-generated questions still need quality evaluation against real course content before production use.
