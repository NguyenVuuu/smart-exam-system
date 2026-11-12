# Gemini 3.1 Flash-Lite local check, 12 November 2026

The local `AI_AGENT_MODEL=gemini-3.1-flash-lite` run passed all four synthetic insight cases in `evals/run.py`: no student history, a released topic metric, an injected instruction in course material, and a teacher question metric. All 18 Python unit tests passed. This is a smoke result, not a measure of accuracy on real course content.

The authenticated HTTP practice draft check did not complete. Two calls received provider HTTP 504 and a later call received provider HTTP 503, despite reducing a one-question request to one candidate. The agent returned a generic 503 without exposing provider details to clients. No practice draft from this model has been accepted in a live HTTP check yet. Retry the check when the provider is available and evaluate teacher-approved course examples before relying on generated practice.
