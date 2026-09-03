import { extname } from "path";
import mammoth from "mammoth";
import { ValidationError } from "../../../errors/AppError";

export interface SourceDocument {
  fileName: string;
  contentType: string;
  buffer: Buffer;
}

export type AiInputContent =
  | { type: "document"; data: string; mime_type: string }
  | { type: "image"; data: string; mime_type: string }
  | { type: "text"; text: string };

const inlineMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function normalizedMimeType(document: SourceDocument) {
  const extension = extname(document.fileName).toLowerCase();
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".txt") return "text/plain";
  if (extension === ".docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return document.contentType;
}

export async function toGeminiContent(
  document: SourceDocument,
): Promise<AiInputContent> {
  const mimeType = normalizedMimeType(document);
  if (inlineMimeTypes.has(mimeType)) {
    return {
      type: mimeType === "application/pdf" ? "document" : "image",
      mime_type: mimeType,
      data: document.buffer.toString("base64"),
    };
  }

  if (mimeType === "text/plain") {
    return {
      type: "text",
      text: `\n--- ${document.fileName} ---\n${document.buffer.toString("utf8")}\n`,
    };
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: document.buffer });
    if (!result.value.trim())
      throw new ValidationError(
        `DOCX file has no readable text: ${document.fileName}`,
      );
    return {
      type: "text",
      text: `\n--- ${document.fileName} ---\n${result.value}\n`,
    };
  }

  throw new ValidationError(`Unsupported AI source file: ${document.fileName}`);
}
