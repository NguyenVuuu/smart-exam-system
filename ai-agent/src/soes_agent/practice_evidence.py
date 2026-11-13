import re


def is_table_of_contents_entry(text: str) -> bool:
    return re.search(r"(?:\.{3,}|…{2,})\s*\d{1,4}\s*$", text.strip()) is not None


def is_heading_only(text: str) -> bool:
    value = text.strip()
    if len(value.split()) > 9 or value.endswith((".", "!", "?", ";")) or re.search(r"[=;{}]", value):
        return False
    is_statement = len(value.split()) >= 7 and re.search(
        r"\b(?:là|có|được|giúp|gồm|kế thừa|phân biệt|trả về|cho phép)\b", value.casefold()
    )
    return not is_statement


def evidence_passages(source: str) -> list[str]:
    """Keep short, literal passages so the model only selects evidence IDs."""
    passages = []
    seen = set()
    for segment in re.split(r"(?<=[.!?;])\s+|\n+", source):
        segment = re.sub(r"^\[Trang \d+\]\s*", "", segment.strip())
        while segment:
            if len(segment) <= 300:
                piece, segment = segment, ""
            else:
                split_at = segment.rfind(" ", 120, 300)
                split_at = split_at if split_at > 0 else 300
                piece, segment = segment[:split_at], segment[split_at:].strip()
            piece = piece.strip()
            key = re.sub(r"\s+", " ", piece).casefold()
            if (len(piece) >= 30 and key not in seen
                    and not re.match(r"^(?:mục lục|chương \d+\b)", key)
                    and not is_table_of_contents_entry(piece)
                    and not is_heading_only(piece)):
                passages.append(piece)
                seen.add(key)
    return passages or _wrapped_line_passages(source)


def _wrapped_line_passages(source: str) -> list[str]:
    """Recover prose split into short PDF lines without sentence punctuation."""
    passages = []
    lines: list[str] = []

    def flush() -> None:
        piece = "\n".join(lines).strip()
        if len(piece) >= 50 and not is_heading_only(piece):
            passages.append(piece)
        lines.clear()

    for raw_line in source.splitlines():
        if re.match(r"^\s*\[Trang \d+\]", raw_line):
            flush()
        line = re.sub(r"^\s*\[Trang \d+\]\s*", "", raw_line).strip()
        if (not line or line == "[...]" or is_table_of_contents_entry(line)
                or re.match(r"^(?:mục lục|chương \d+\b)", line.casefold())):
            flush()
            continue
        if lines and len("\n".join(lines)) + len(line) > 300:
            flush()
        lines.append(line)
        if len("\n".join(lines)) >= 160 or line.endswith((".", "!", "?", ";")):
            flush()
    flush()
    return passages


def batch_evidence(passages: list[str], batch_index: int, batch_count: int,
                   excluded: set[str] | None = None) -> dict[str, str]:
    choices = [passage for passage in passages[batch_index::batch_count]
               if passage not in (excluded or set())]
    if not choices:
        choices = passages[batch_index::batch_count] or passages
    selected = (choices if len(choices) <= 16 else [
        choices[round(index * (len(choices) - 1) / 15)] for index in range(16)
    ])
    return {f"EVIDENCE_{index:04d}": passage for index, passage in enumerate(selected, 1)}
