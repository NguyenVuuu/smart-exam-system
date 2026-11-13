import re


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
            if len(piece) >= 30 and key not in seen and not re.match(r"^(?:mục lục|chương \d+\b)", key):
                passages.append(piece)
                seen.add(key)
    if not passages and len(source.strip()) >= 10:
        passages = [source.strip()[:300]]
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
