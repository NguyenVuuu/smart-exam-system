from collections import OrderedDict
from threading import Lock
from time import monotonic
from sys import getsizeof


class MaterialTextCache:
    """Bounded process-local cache; callers must supply and authorize the file itself."""

    def __init__(self, max_bytes: int = 16 * 1024 * 1024, max_entries: int = 16,
                 ttl_seconds: float = 900):
        self.max_bytes = max_bytes
        self.max_entries = max_entries
        self.ttl_seconds = ttl_seconds
        self._entries: OrderedDict[str, tuple[str, float, int]] = OrderedDict()
        self._bytes = 0
        self._lock = Lock()

    def _remove(self, key: str) -> None:
        _, _, size = self._entries.pop(key)
        self._bytes -= size

    def _expire(self) -> None:
        now = monotonic()
        for key, (_, expires, _) in list(self._entries.items()):
            if expires <= now:
                self._remove(key)

    def get(self, key: str) -> str | None:
        with self._lock:
            self._expire()
            entry = self._entries.get(key)
            if entry is None:
                return None
            self._entries.move_to_end(key)
            return entry[0]

    def put(self, key: str, text: str) -> None:
        size = getsizeof(text)
        with self._lock:
            self._expire()
            if key in self._entries:
                self._remove(key)
            if size > self.max_bytes or self.max_entries < 1:
                return
            while self._entries and (self._bytes + size > self.max_bytes
                                     or len(self._entries) >= self.max_entries):
                self._remove(next(iter(self._entries)))
            self._entries[key] = (text, monotonic() + self.ttl_seconds, size)
            self._bytes += size
