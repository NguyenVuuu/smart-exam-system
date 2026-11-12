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
