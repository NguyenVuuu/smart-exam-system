# Gemini 3.5 Flash-Lite local check, 13 November 2026

The Python agent and the existing backend question generator are configured to use `gemini-3.5-flash-lite` in the local setup. All Python workflows use one `AI_AGENT_MODEL`. Structured responses for practice, insights, and exam matrices use function calling.

All 18 Python unit tests passed. An authenticated HTTP request generated and validated one practice draft. In the four synthetic insight cases, three passed on the first run; the course-material injection case received a provider error. A retry received the same provider error. A full HTTP smoke request also failed during insights because the provider returned HTTP 503. Simple direct model calls succeeded. These results show intermittent provider availability; they do not establish accuracy on real course content.

Before using generated material for a real class, evaluate it against teacher-reviewed examples and keep teacher approval for exam content. No model training or fine-tuning was performed.

The teacher question-draft workflow was exercised with one synthetic text source and the backend's one-question JSON schema. The first attempt exposed a local schema-binding error, which was corrected by declaring the schema as a function-call tool. The next request reached Gemini but returned HTTP 503 (high demand), so live question-draft quality remains unverified.

After adding evidence checks and class sample reporting, all 28 Python unit tests passed. The five synthetic insight cases passed in one local run: empty history, student topic, malicious material instruction, teacher question quality, and teacher class analysis. An earlier run caught an unsupported percentage format in the evaluator and inconsistent class sample wording; both checks were corrected. This synthetic pass does not measure answer quality on real student data or provider availability over time.
