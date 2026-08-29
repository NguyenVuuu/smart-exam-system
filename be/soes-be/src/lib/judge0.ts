import http from "http";
import { URL } from "url";
import { judge0Config } from "../config";

// ============================================================
// THAY THẾ toàn bộ hàm httpPostJson cũ (dùng http.request)
// ============================================================
async function httpPostJson(
  urlStr: string,
  headers: Record<string, string>,
  bodyObj: any,
  timeoutMs = 30000,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(urlStr, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Connection: "close", // <-- THÊM DÒNG NÀY: tránh keep-alive treo
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal,
    });

    const body = await response.text();
    return { status: response.status, body };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Judge0 request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface Judge0Submission {
  source_code: string;
  language_id: number | string;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

export interface Judge0SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

export interface Judge0BatchSubmissionResult {
  submissions: Judge0SubmissionResult[];
}

export interface LanguageConfig {
  id: number;
  name: string;
  judge0Id: number;
}

// Mapping from our internal language string to Judge0 language IDs
export const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  C: { id: 1, name: "C", judge0Id: 50 },
  CPP: { id: 2, name: "C++", judge0Id: 54 },
  PYTHON: { id: 3, name: "Python", judge0Id: 71 },
  PYTHON3: { id: 4, name: "Python 3", judge0Id: 71 },
  JAVA: { id: 5, name: "Java", judge0Id: 62 },
  JAVASCRIPT: { id: 6, name: "JavaScript", judge0Id: 63 },
  TYPESCRIPT: { id: 7, name: "TypeScript", judge0Id: 74 },
  UNKNOWN: { id: 99, name: "Unknown", judge0Id: 71 }, // Default to Python
};

export class Judge0Error extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: any,
  ) {
    super(message);
    this.name = "Judge0Error";
  }
}

export class Judge0Service {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly defaultTimeoutMs: number;

  constructor() {
    this.baseUrl = judge0Config.baseUrl;
    this.apiKey = judge0Config.apiKey;
    this.defaultTimeoutMs = judge0Config.defaultTimeoutMs;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.apiKey) {
      headers["X-RapidAPI-Key"] = this.apiKey;
    }

    return headers;
  }

  private getJudge0LanguageId(language: string): number {
    const config = LANGUAGE_MAP[language.toUpperCase()];
    if (!config) {
      return LANGUAGE_MAP.UNKNOWN.judge0Id;
    }
    return config.judge0Id;
  }

  private decodeBase64(value: string | null): string | null {
    if (!value) return null;
    try {
      return Buffer.from(value, "base64").toString("utf-8");
    } catch {
      return value;
    }
  }

  /**
   * Submit a single code submission to Judge0
   */
  /**
   * Submit a single code submission to Judge0
   */
  async submitSingle(
    submission: Judge0Submission,
    timeoutMs?: number, // <-- THÊM THAM SỐ NÀY
  ): Promise<Judge0SubmissionResult> {
    const judge0LanguageId = this.getJudge0LanguageId(
      submission.language_id.toString(),
    );

    const payload = {
      source_code: Buffer.from(submission.source_code ?? "").toString("base64"),
      language_id: judge0LanguageId,
      stdin: submission.stdin
        ? Buffer.from(submission.stdin).toString("base64")
        : undefined,
      expected_output: submission.expected_output
        ? Buffer.from(submission.expected_output).toString("base64")
        : undefined,
      cpu_time_limit: submission.cpu_time_limit || this.defaultTimeoutMs / 1000,
      memory_limit: submission.memory_limit,
      wait: true,
    };

    const url = `${this.baseUrl}/submissions?base64_encoded=true&wait=true`;

    try {
      // <-- SỬA DÒNG NÀY: truyền timeoutMs vào
      const response = await httpPostJson(
        url,
        this.getHeaders(),
        payload,
        timeoutMs || 30000,
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Judge0Error(
          `Judge0 API error: ${response.status}`,
          response.status,
          response.body,
        );
      }

      const rawResult = JSON.parse(response.body) as Judge0SubmissionResult;
      return {
        ...rawResult,
        stdout: this.decodeBase64(rawResult.stdout),
        stderr: this.decodeBase64(rawResult.stderr),
        compile_output: this.decodeBase64(rawResult.compile_output),
        message: this.decodeBase64(rawResult.message),
      };
    } catch (error) {
      if (error instanceof Judge0Error) {
        throw error;
      }
      throw new Judge0Error(
        `Judge0 request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ============================================================
  // THÊM METHOD NÀY vào class Judge0Service (sau submitSingle)
  // ============================================================

  /**
   * Submit code with wait=false, then poll for result.
   * Avoids long-running HTTP connections that hang on Docker Desktop Windows.
   */
  async submitAndPoll(
    submission: Judge0Submission,
    timeoutMs = 30000,
  ): Promise<Judge0SubmissionResult> {
    const judge0LanguageId = this.getJudge0LanguageId(
      submission.language_id.toString(),
    );

    // ── Step 1: Submit with wait=false (fast, returns token immediately) ──
    const payload = {
      source_code: Buffer.from(submission.source_code ?? "").toString("base64"),
      language_id: judge0LanguageId,
      stdin: submission.stdin
        ? Buffer.from(submission.stdin).toString("base64")
        : undefined,
      expected_output: submission.expected_output
        ? Buffer.from(submission.expected_output).toString("base64")
        : undefined,
      cpu_time_limit: submission.cpu_time_limit || this.defaultTimeoutMs / 1000,
      memory_limit: submission.memory_limit,
      wait: false,
    };

    const submitUrl = `${this.baseUrl}/submissions?base64_encoded=true&wait=false`;

    const submitResponse = await httpPostJson(
      submitUrl,
      this.getHeaders(),
      payload,
      10000, // Submit should be fast
    );

    if (submitResponse.status < 200 || submitResponse.status >= 300) {
      throw new Judge0Error(
        `Judge0 API error: ${submitResponse.status}`,
        submitResponse.status,
        submitResponse.body,
      );
    }

    const { token } = JSON.parse(submitResponse.body) as { token: string };
    if (!token) {
      throw new Judge0Error("No token returned from Judge0");
    }

    // ── Step 2: Poll for result ──
    const pollUrl = `${this.baseUrl}/submissions/${token}?base64_encoded=true`;
    const pollIntervalMs = 800;
    const maxPollTimeMs = timeoutMs;
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTimeMs) {
      const pollResponse = await fetch(pollUrl, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!pollResponse.ok) {
        throw new Judge0Error(`Judge0 poll error: ${pollResponse.status}`);
      }

      const result = (await pollResponse.json()) as Judge0SubmissionResult;

      // Status IDs: 1 = In Queue, 2 = Processing
      // 3+ = Finished (Accepted, Wrong Answer, TLE, etc.)
      if (result.status.id !== 1 && result.status.id !== 2) {
        return {
          ...result,
          stdout: this.decodeBase64(result.stdout),
          stderr: this.decodeBase64(result.stderr),
          compile_output: this.decodeBase64(result.compile_output),
          message: this.decodeBase64(result.message),
        };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Judge0Error(`Judge0 polling timed out after ${maxPollTimeMs}ms`);
  }

  /**
   * Submit multiple code submissions in batch (more efficient for multiple test cases)
   */
  async submitBatch(
    submissions: Judge0Submission[],
  ): Promise<Judge0BatchSubmissionResult> {
    const maxSubmissions = judge0Config.maxSubmissionsPerRequest;
    if (submissions.length > maxSubmissions) {
      throw new Judge0Error(
        `Cannot submit more than ${maxSubmissions} submissions at once`,
      );
    }

    const url = `${this.baseUrl}/submissions/batch?base64_encoded=false`;

    const payload = submissions.map((sub) => ({
      ...sub,
      language_id: this.getJudge0LanguageId(sub.language_id.toString()),
      cpu_time_limit: sub.cpu_time_limit || this.defaultTimeoutMs / 1000,
    }));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ submissions: payload }),
      });

      if (!response.ok) {
        throw new Judge0Error(
          `Judge0 API error: ${response.status} ${response.statusText}`,
          response.status,
          await response.text(),
        );
      }

      const result = await response.json();
      return result as Judge0BatchSubmissionResult;
    } catch (error) {
      if (error instanceof Judge0Error) {
        throw error;
      }
      throw new Judge0Error(
        `Judge0 batch request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get submission status by token
   */
  async getSubmission(token: string): Promise<Judge0SubmissionResult> {
    const url = `${this.baseUrl}/submissions/${token}?base64_encoded=false`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Judge0Error(
          `Judge0 API error: ${response.status} ${response.statusText}`,
          response.status,
          await response.text(),
        );
      }

      return (await response.json()) as Judge0SubmissionResult;
    } catch (error) {
      if (error instanceof Judge0Error) {
        throw error;
      }
      throw new Judge0Error(
        `Judge0 get submission failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Helper to map Judge0 status ID to our internal status
   */
  static mapStatusToInternal(
    judge0StatusId: number,
  ):
    | "PASSED"
    | "WRONG_ANSWER"
    | "RUNTIME_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED"
    | "SYSTEM_ERROR" {
    if (judge0StatusId === 3) return "PASSED"; // Accepted
    if (judge0StatusId === 4) return "WRONG_ANSWER"; // Wrong Answer
    if (judge0StatusId === 5) return "TIME_LIMIT_EXCEEDED";
    if (judge0StatusId === 6) return "SYSTEM_ERROR"; // Compilation Error - map to SYSTEM_ERROR for test cases
    if (judge0StatusId === 7) return "RUNTIME_ERROR"; // Runtime Error
    if (judge0StatusId === 8) return "MEMORY_LIMIT_EXCEEDED";
    if (judge0StatusId === 9) return "SYSTEM_ERROR";
    if (judge0StatusId === 10) return "SYSTEM_ERROR"; // Rejected
    return "SYSTEM_ERROR";
  }

  /**
   * Helper to normalize output comparison (trim trailing whitespace and newlines)
   */
  static normalizeOutput(output: string | null): string {
    if (!output) return "";
    return output.trim().replace(/\r\n/g, "\n");
  }

  /**
   * Helper to check if output matches expected (with normalization)
   */
  static outputsMatch(actual: string | null, expected: string | null): boolean {
    const normalizedActual = this.normalizeOutput(actual);
    const normalizedExpected = this.normalizeOutput(expected);
    return normalizedActual === normalizedExpected;
  }
}

// Singleton instance
export const judge0Service = new Judge0Service();

export default judge0Service;
