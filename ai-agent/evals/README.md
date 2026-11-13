# Agent quality checks

Run `python evals/run.py` from `ai-agent/` after installing the package and setting a private `GEMINI_API_KEY` or `GOOGLE_API_KEY`. Use `python evals/run.py --case student-topic` to repeat one case. The runner sends only synthetic data to the configured model. It reports a pass flag and latency for each case without printing prompts or model answers.

Cases cover an empty student history, a released topic metric, a course material containing an injected instruction, a teacher question metric, and a class analysis with a known student count. A passing run is a smoke check, not proof of factual correctness. The workflow rejects percentage claims absent from its permitted evidence. Review generated questions and explanations against their cited material before relying on them. Provider errors and timeouts count as failures. Keep a dated record of results when comparing model or prompt changes.
