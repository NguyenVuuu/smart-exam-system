# Gemini 3.5 Flash-Lite local check, 13 November 2026

The Python agent and the existing backend question generator are configured to use `gemini-3.5-flash-lite` in the local setup. All Python workflows use one `AI_AGENT_MODEL`. Structured responses for practice, insights, and exam matrices use function calling.

All 18 Python unit tests passed. An authenticated HTTP request generated and validated one practice draft. In the four synthetic insight cases, three passed on the first run; the course-material injection case received a provider error. A retry received the same provider error. A full HTTP smoke request also failed during insights because the provider returned HTTP 503. Simple direct model calls succeeded. These results show intermittent provider availability; they do not establish accuracy on real course content.

Before using generated material for a real class, evaluate it against teacher-reviewed examples and keep teacher approval for exam content. No model training or fine-tuning was performed.
