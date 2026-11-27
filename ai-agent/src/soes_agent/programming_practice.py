import asyncio
import logging
import re
from collections import Counter

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from .contracts import ProgrammingPracticeDraft, ProgrammingPracticeQuestion, ProgrammingPracticeRequest
from .materials import extract_material, source_location
from .rag import retrieve_material
from .practice import is_document_meta_question, normalize
from .practice_evidence import batch_evidence, evidence_passages, is_table_of_contents_entry
from .instruction_verification import verify_instruction_fulfillment
from .performance import measure_stage
from .web_retrieval import retrieve_programming_web

logger = logging.getLogger(__name__)


def add_standard_imports(question: ProgrammingPracticeQuestion) -> ProgrammingPracticeQuestion:
    """Ensure the starter frame includes common standard-library imports used by the solution."""
    code = f"{question.starterCode}\n{question.referenceSolution}"
    starter = question.starterCode
    if question.language == "JAVA":
        imports = []
        needed = set(re.findall(r"\b(Scanner|Arrays|Collections|ArrayList|List|Map|Set|HashMap|HashSet|Queue|Deque)\b", code))
        if needed and "import java.util.*;" not in starter:
            existing = set(re.findall(r"import\s+java\.util\.(\w+)\s*;", starter))
            imports.extend(f"import java.util.{name};" for name in sorted(needed - existing))
        if "BigInteger" in code and "import java.math.BigInteger;" not in starter:
            imports.append("import java.math.BigInteger;")
        if imports:
            starter = "\n".join([*imports, starter.lstrip()])
    elif question.language == "C":
        headers = []
        mapping = ((r"\b(printf|scanf|puts|gets|fgets|FILE|EOF)\b", "stdio.h"),
                   (r"\b(strlen|strcmp|strcpy|strcat|memcpy|memset|strtok)\b", "string.h"),
                   (r"\b(malloc|calloc|realloc|free|abs|atoi|qsort)\b", "stdlib.h"),
                   (r"\b(sqrt|pow|ceil|floor|round)\b", "math.h"))
        for pattern, header in mapping:
            directive = f"#include <{header}>"
            if re.search(pattern, code) and directive not in starter:
                headers.append(directive)
        if headers:
            starter = "\n".join([*headers, starter.lstrip()])
    elif question.language == "CPP":
        mapping = ((r"\b(sort|reverse|find|count|lower_bound|upper_bound|min|max)\s*\(", "algorithm"),
                   (r"\b(accumulate)\s*\(", "numeric"),
                   (r"\b(vector)\b", "vector"), (r"\b(string|getline|to_string)\b", "string"),
                   (r"\b(queue|priority_queue)\b", "queue"), (r"\b(stack)\b", "stack"),
                   (r"\b(set)\b", "set"), (r"\b(map)\b", "map"),
                   (r"\b(sqrt|pow|abs)\s*\(", "cmath"))
        headers = []
        for pattern, header in mapping:
            directive = f"#include <{header}>"
            if re.search(pattern, code) and directive not in starter:
                headers.append(directive)
        if headers:
            starter = "\n".join([*headers, starter.lstrip()])
    return question.model_copy(update={"starterCode": starter})


def review_programming_questions(questions: list[ProgrammingPracticeQuestion], source: str,
                                 request: ProgrammingPracticeRequest) -> tuple[list[ProgrammingPracticeQuestion], Counter]:
    source_text = normalize(source)
    excluded_stems = {normalize(stem) for stem in request.excludedStems}
    accepted: list[ProgrammingPracticeQuestion] = []
    stems: set[str] = set()
    issues: Counter = Counter()
    for question in questions:
        stem = normalize(question.stem)
        if stem in stems or stem in excluded_stems:
            issues["Duplicate programming practice question"] += 1
        elif is_document_meta_question(question.stem):
            issues["Programming practice question asks about document structure"] += 1
        elif question.language != request.language:
            issues["Programming practice language mismatch"] += 1
        elif normalize(question.supportQuote) not in source_text or is_table_of_contents_entry(question.supportQuote):
            issues["Programming practice source quote is invalid"] += 1
        elif len({test.input for test in question.testCases}) != len(question.testCases):
            issues["Programming practice test inputs are duplicated"] += 1
        else:
            stems.add(stem)
            accepted.append(question)
    return accepted, issues


def parse_candidates(response: object, evidence: dict[str, str]) -> list[ProgrammingPracticeQuestion]:
    if not isinstance(response, dict) or not isinstance(response.get("questions"), list):
        logger.warning("Programming practice response is malformed type=%s", type(response).__name__)
        return []
    candidates = []
    for item in response["questions"]:
        try:
            question = ProgrammingPracticeQuestion.model_validate(item)
        except ValidationError as exc:
            logger.warning("Programming practice candidate schema rejected fields=%s",
                           [(error["loc"], error["type"]) for error in exc.errors()])
            continue
        quote = evidence.get(question.supportQuote.strip().upper())
        candidates.append(question.model_copy(update={"supportQuote": quote}) if quote else question)
    return candidates


async def generate_programming_practice(model: ChatGoogleGenerativeAI,
                                        request: ProgrammingPracticeRequest) -> ProgrammingPracticeDraft:
    try:
        full_source = await asyncio.to_thread(extract_material, request.material)
    except ValueError:
        full_source = ""
    query = request.instruction or request.material.title
    web_text = ""
    web_urls: list[str] = []
    with measure_stage("programming.retrieve"):
        if full_source and len(full_source.strip()) >= 300:
            material_source = await retrieve_material(full_source, query, title=request.material.title)
            web_source = ""
        else:
            (web_text, web_urls), material_source = await asyncio.gather(
                retrieve_programming_web(query, request.language, getattr(model, "model", "gemini-3.5-flash-lite")),
                retrieve_material(full_source, query, title=request.material.title) if full_source else asyncio.sleep(0, result=""),
            )
            web_source = await retrieve_material(web_text, query, title="Programming web evidence") if web_text else ""
    source = "\n\n".join(filter(None, [web_source, material_source]))
    passages = evidence_passages(source)
    if not passages:
        default_topic = query or request.material.title or "Lập trình"
        passages = [f"Chủ đề thực hành {request.language}: {default_topic}. Luyện tập tư duy thuật toán, cấu trúc dữ liệu và xử lý bài toán console."]
        source = passages[0]

    # Gemini rejects the nested test-case schema in json_schema mode; tool calling accepts it.
    structured = model.with_structured_output(ProgrammingPracticeDraft.model_json_schema(), method="function_calling")
    model_slots = asyncio.Semaphore(4)
    batch_count = max(1, (request.count + 4) // 5)
    candidates: list[ProgrammingPracticeQuestion] = []
    rejected_stems: list[str] = []

    async def generate_batch(size: int, index: int, previous: list[ProgrammingPracticeQuestion]) -> list[ProgrammingPracticeQuestion]:
        evidence = batch_evidence(passages, index % batch_count, batch_count,
                                  {question.supportQuote for question in previous})
        source_message = "\n".join(f"{key}: {value}" for key, value in evidence.items())
        existing = " | ".join([
            *request.excludedStems,
            *(question.stem for question in previous),
            *rejected_stems,
        ])[:4000]
        messages = [
            ("system", "Tạo bài luyện viết chương trình bằng tiếng Việt dựa trên kiến thức tài liệu và tri thức thuật toán chuẩn. "
             "Mỗi bài phải độc lập, có đầu vào, đầu ra, giới hạn và ví dụ cụ thể; stem dài ít nhất 80 ký tự, không hỏi về tài liệu, chương hoặc trang. "
             "Yêu cầu của người học là ràng buộc trọng tâm: mọi bài phải tập trung trực tiếp vào đúng chủ đề/kỹ thuật đó. "
             "Tài liệu cung cấp phạm vi kiến thức; hãy tự do vận dụng tư duy thuật toán để thiết kế các bài toán phong phú, đa dạng xoay quanh chủ đề. "
             "Với yêu cầu ngắn như 'vòng lặp' hay 'mảng', hãy tạo bài mà lời giải thực sự cần dùng cấu trúc đó. "
             "referenceSolution là chương trình hoàn chỉnh đọc stdin và ghi stdout, không đọc tệp hoặc mạng. "
             "Tạo 2-3 test case có input khác nhau, expectedOutput chính xác với referenceSolution, "
             "gồm trường hợp biên. starterCode chỉ là khung, không chứa lời giải. "
             "explanation BẮT BUỘC phải giải thích thuật toán và các bước xử lý cụ thể (nêu rõ các biến cần khai báo, cách đọc dữ liệu đầu vào stdin, cách duyệt vòng lặp/mảng, điều kiện rẽ nhánh và cách in kết quả ra stdout); TUYỆT ĐỐI KHÔNG viết chung chung, KHÔNG được chỉ nhắc lại đề bài (tuyệt đối KHÔNG viết kiểu 'Bài toán yêu cầu sử dụng...'). "
             "supportQuote phải là ID EVIDENCE của đoạn kiến thức hỗ trợ. "
             "Đảm bảo các bài toán không trùng lặp ý tưởng."),
            ("human", f"Tạo đúng {size} bài viết mã khác nhau. Ngôn ngữ: {request.language}. "
             f"Mức độ: {request.difficulty}. Yêu cầu: {request.instruction or 'luyện kiến thức trọng tâm'}. "
             f"Không lặp hoặc diễn đạt lại các bài đã giữ/bị loại: {existing or 'không có'}. "
             "Mọi câu phải trực tiếp đáp ứng đúng yêu cầu, không chỉ nhắc tên chủ đề. "
             "Trường explanation phải giải thích thuật toán và các bước giải cụ thể, không nhắc lại đề bài.\n"
             f"Các đoạn kiến thức:\n{source_message}"),
        ]
        async with model_slots:
            with measure_stage("programming.generate", size):
                response = await structured.ainvoke(messages)
        parsed = parse_candidates(response, evidence)
        reviewed, issues = review_programming_questions(parsed, source, request)
        return [add_standard_imports(question) for question in reviewed[:size]]

    for attempt in range(3):
        accepted, issues = review_programming_questions(candidates, source, request)
        missing = request.count - len(accepted)
        if missing <= 0:
            break
        if attempt:
            logger.warning("Programming practice candidates insufficient requested=%s received=%s valid=%s issues=%s",
                           request.count, len(candidates), len(accepted), dict(issues))
        batch_sizes = [min(5, missing - start) for start in range(0, missing, 5)]
        candidate_sizes = [min(5, max(size + 1, size * 2)) for size in batch_sizes]
        batches = await asyncio.gather(*(
            generate_batch(size, index + attempt, accepted) for index, size in enumerate(candidate_sizes)
        ))
        candidates.extend(question for batch in batches for question in batch)

    accepted, issues = review_programming_questions(candidates, source, request)
    if len(accepted) < request.count:
        logger.warning("Programming practice candidates insufficient requested=%s received=%s valid=%s issues=%s",
                       request.count, len(candidates), len(accepted), dict(issues))
        if not accepted:
            raise ValueError(next(iter(issues), "Programming practice question count mismatch"))
        logger.info("Programming practice returning partial batch requested=%s returned=%s",
                    request.count, len(accepted))
    return ProgrammingPracticeDraft(questions=[question.model_copy(update={
        "sourceLocation": (source_location(full_source, question.supportQuote, request.material.mimeType)
                           if normalize(question.supportQuote) in normalize(full_source) else None),
        "sourceUrls": web_urls if web_text and normalize(question.supportQuote) in normalize(web_text) else [],
    }) for question in accepted[:request.count]])
