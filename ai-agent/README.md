# SOES AI Agent

Private LangChain/LangGraph service. The TypeScript backend validates user roles and release rules before sending aggregate evidence. The service must not be exposed directly to browsers or mobile apps.

Install Python 3.12 or 3.13. For local development, run the configuration helper once from the repository root. It copies the existing backend Gemini key into the ignored `ai-agent/.env`, generates a shared secret, and enables the backend client without printing secrets:

```powershell
./ai-agent/scripts/configure-local.ps1
```

The helper preserves an existing shared secret and model setting. For a new agent `.env`, it uses the backend's `GEMINI_MODEL` value. The two `.env` files are ignored by Git. Start the private agent in its own terminal from `ai-agent`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[test]"
python -m pytest
python -m uvicorn soes_agent.main:app --host 127.0.0.1 --port 8001
```

The service loads `ai-agent/.env` on startup. In a second terminal, start the backend from `be/soes-be` with `npm run dev`, then start the web or mobile client as usual. Restart both services after changing their `.env` files. Check `http://127.0.0.1:8001/health`; it should respond with `{"status":"ok"}`. If a student or teacher request returns 503, verify that both services are running and that the backend and agent have the same shared secret.

Run `python scripts/smoke-local.py` from `ai-agent` to check the authenticated HTTP path with synthetic topic data. Add `--practice` to also test one generated practice draft, or `--practice-only` to test that endpoint alone. The script prints only pass messages; the server log records endpoint, status, elapsed time, and model, without prompts or credentials. HTTP 429 means the provider rate limit was reached; HTTP 503 means the provider is temporarily unavailable. Either can occur even when the local services are running.

Set `AI_AGENT_SHARED_SECRET` to the same high-entropy value in the backend and this service. Set `GOOGLE_API_KEY` or `GEMINI_API_KEY` only in the private agent environment. Backend calls send the model selected in system AI settings to every workflow; standalone agent calls use `AI_AGENT_MODEL` as a fallback. Local development currently selects `gemini-3.5-flash-lite`. Model availability and output quality can change; compare candidates with `python evals/run.py` before switching. Keep secrets out of Git.

Before starting the application, apply the backend migrations from `be/soes-be` with `npx prisma migrate deploy`. The backend must have `AI_AGENT_ENABLED=true`, `AI_AGENT_URL=http://127.0.0.1:8001`, and the same `AI_AGENT_SHARED_SECRET` as the Python process. Keep the Python service listening on localhost or a private network. The model provider must be configured separately; installing Python and LangChain alone does not enable AI responses.

When `AI_AGENT_ENABLED=true`, the teacher question generator sends teacher-owned text, PDF, and image sources to the authenticated `/v1/teacher/question-draft` workflow. The request uses the model selected in backend AI settings. The backend still validates each draft, requests at most one correction, stores generation history, and requires teacher approval before saving questions. If the agent fails, generation fails visibly; it does not retry through a separate provider. With the agent disabled, the existing direct Gemini generator remains available. Restart the Python and backend processes after changing this routing code.

The agent limits provider calls to 50 seconds and the backend request to 60 seconds by default. Check `/health` locally before trying the UI. Provider availability and quotas still depend on the configured account.

The student material flow uses the existing course enrollment access rule. The backend allows a student to select one PDF, DOCX, or UTF-8 TXT file already visible in their enrolled class, up to 3 MiB. The agent extracts all readable pages and text (up to 4 million characters), then selects up to 20,000 characters relevant to the student's question or practice topic for each model call. This makes later chapters available without sending an entire long document to the model. The agent requires a valid material citation in its answer. Scanned PDFs without extractable text are unsupported. The teacher's `aiEnabled` material flag remains reserved for teacher question generation. Material-based study suggestions never imply that a hidden exam was graded or analyzed.

Practice generation uses the selected material, an optional student instruction, and a requested count from 1 to 10. It rejects drafts without an exact source quote, with duplicate options, placeholder choices, or questions about document chapters and sections instead of course knowledge. A generated set is stored separately from official exam attempts; the backend grades one submission using a one-time database claim. Answers and explanations are returned only after submission. Generation is limited to ten sets per student per rolling 24 hours. Model-generated questions still need quality evaluation against real course content before production use.

The student agent receives only released results whose review policy allows answer review. It can explain an individual exam question on the web only after the schedule permits full answer-key review; the backend resolves that question from the student's own attempt. During any active exam, learning and practice endpoints are unavailable. Mobile offers the learning assistant and material practice, not exam taking. The teacher agent is scoped to the teacher's scheduled classes and receives aggregate question, topic, and class statistics. A question needs at least 20 scored responses from 5 distinct students before being labeled unusually easy or hard; a topic needs 5 responses spanning 3 distinct questions. Class conclusions need at least 5 distinct students. These are minimum sample rules, not proof that a conclusion is statistically significant.

Agent request audit records the actor and affected record IDs without storing prompts, course materials, source code, answers, or generated text. The model's cited IDs are checked against permitted evidence, unsupported percentage claims are suppressed, and class sample sizes are attached from backend statistics. Run `python evals/run.py` for synthetic quality cases and review the dated reports in `evals/`. No custom model training or fine-tuning has been performed; validation with teacher-reviewed course examples is still required before treating generated exam content as reliable.
