import logging
from contextlib import contextmanager
from time import perf_counter

logger = logging.getLogger(__name__)


@contextmanager
def measure_stage(stage: str, count: int = 0):
    """Log timing metadata only, including failed or cancelled operations."""
    started = perf_counter()
    try:
        yield
    finally:
        logger.info("AI stage=%s count=%s elapsed_ms=%s",
                    stage, count, round((perf_counter() - started) * 1000))
