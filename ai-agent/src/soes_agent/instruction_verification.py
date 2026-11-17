"""Independent semantic checks that generated items satisfy the user's requested topic."""

import logging
import json
import re
from typing import Any

from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)


class InstructionVerdict(BaseModel):
    itemIndex: int = Field(ge=0)
    fulfillsInstruction: bool
    technicallySound: bool


class InstructionVerdicts(BaseModel):
    verdicts: list[InstructionVerdict]


def _item_text(item: Any) -> str:
    if hasattr(item, "model_dump"):
        item = item.model_dump(mode="json")
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return json.dumps(item, ensure_ascii=False, default=str)[:8000]
    return str(item)[:8000]


async def verify_instruction_fulfillment(model, instruction: str | None, items: list[Any], *,
                                         evidence: str = "") -> set[int]:
    """Return indices independently confirmed to fit the prompt and be technically sound.

    Empty instructions impose no topical constraint, but generated programming problems
    still receive a technical consistency review.
    """
    if not items:
        return set()
    if not (instruction or "").strip() and not evidence:
        return set(range(len(items)))
    prompt_items = "\n\n".join(f"ITEM {index}\n{_item_text(item)}" for index, item in enumerate(items))
    schema = InstructionVerdicts.model_json_schema()
    verifier = model.with_structured_output(schema, method="json_schema")
    try:
        result = await verifier.ainvoke([
            ("system", "Bạn là bộ kiểm định độc lập, không phải bộ sinh. Đánh giá riêng từng mục. "
             "fulfillsInstruction=true chỉ khi nội dung thực sự tập trung vào yêu cầu cụ thể của người dùng; "
             "chỉ nhắc tên chủ đề thoáng qua không được tính. Nếu yêu cầu gồm nhiều ràng buộc, phải đáp ứng "
             "các ràng buộc quan trọng. technicallySound=true chỉ khi thuật toán, đáp án, mã mẫu và test "
             "nhất quán, đề bài xác định rõ đầu vào/đầu ra và không có dữ kiện mâu thuẫn. Với câu trắc nghiệm, "
             "đáp án phải đúng và duy nhất theo nguồn. Với bài lập trình, tự giải độc lập bài toán và kiểm tra "
             "referenceSolution cùng toàn bộ expectedOutput; không tin lời giải hay test do mô hình sinh. "
             "Nếu không thể xác minh, đánh dấu false. Không nới lỏng tiêu chí để đủ số lượng."),
            ("human", f"Yêu cầu người dùng: {(instruction or '').strip() or 'Tạo nội dung chính xác theo tài liệu.'}\n"
             f"Bằng chứng tài liệu:\n{evidence[:12000]}\n\nCác mục cần kiểm định:\n{prompt_items}"),
        ])
        verdicts = InstructionVerdicts.model_validate(result).verdicts
    except (ValidationError, TypeError, ValueError) as exc:
        logger.warning("AI instruction verification failed error_type=%s", type(exc).__name__)
        return set()

    by_index: dict[int, list[InstructionVerdict]] = {}
    for verdict in verdicts:
        if verdict.itemIndex < len(items):
            by_index.setdefault(verdict.itemIndex, []).append(verdict)
    return {index for index, values in by_index.items()
            if len(values) == 1 and values[0].fulfillsInstruction and values[0].technicallySound}


def extract_teacher_requirement(prompt: str) -> str:
    match = re.search(r"^Yêu cầu bổ sung[^:]*:\s*(.*)$", prompt, re.MULTILINE)
    return match.group(1).strip() if match else ""
