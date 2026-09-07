import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DATA_DIR } from "../paths";
import { loadSettings } from "../settings-store";
import { CodexError } from "../codex-errors";
import type { AIProvider, RunOptions } from "../provider-types";

type Message = { role: "system" | "user" | "assistant"; content: string };
type Completion = {
  choices?: { message?: { content?: string; refusal?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
  status?: string;
  error?: { message?: string };
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
};

function sessionPath(id: string) {
  if (!/^web-[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid web chat session. Start a new chat.");
  return path.join(DATA_DIR, "web-sessions", `${id}.json`);
}

function systemMessage(schema: object): Message {
  return {
    role: "system",
    content: `You are the document study assistant for Get It. Follow the user's study task. Return ONLY a valid JSON object matching this schema, without markdown fences:\n${JSON.stringify(schema)}`,
  };
}

async function complete<T>(messages: Message[], model: string, opts?: RunOptions) {
  const settings = loadSettings();
  if (!settings.piUrl || !settings.piApiKey) throw new CodexError("auth_lost", "API endpoint or API key is missing.");
  const responses = settings.piApiType === "openai-responses";
  const url = new URL(`${settings.piUrl.replace(/\/$/, "")}/${responses ? "responses" : "chat/completions"}`);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Unsupported API URL.");
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.piApiKey}` },
      body: JSON.stringify(responses
        ? { model, input: messages, stream: false, store: false, text: { format: { type: "json_object" } }, reasoning: { effort: opts?.reasoning ?? "low" } }
        : { model, messages, stream: false, response_format: { type: "json_object" }, ...(opts?.reasoning ? { reasoning_effort: opts.reasoning } : {}) }),
      signal: opts?.signal,
    });
  } catch (error) {
    if (opts?.signal?.aborted) throw error;
    throw new CodexError("generic", "Cannot reach the configured API. Check the connection and try again.");
  }
  if (!response.ok) {
    const detail = (await response.text()).split(settings.piApiKey).join("[redacted]").slice(0, 600);
    throw new Error(`API HTTP ${response.status}: ${detail}`);
  }
  const result = await response.json() as Completion;
  const choice = result.choices?.[0];
  if (choice?.finish_reason === "length" || result.status === "incomplete") throw new Error("The API response was truncated. Try a smaller document or request.");
  const messageOutput = result.output?.filter(item => item.type === "message").at(-1);
  if (choice?.message?.refusal || messageOutput?.content?.some(part => part.type === "refusal") || result.error || result.status === "failed") throw new Error("The API could not complete this study request.");
  const content = responses
    ? messageOutput?.content?.filter(part => part.type === "output_text").map(part => part.text ?? "").join("")
    : choice?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("The API returned an empty response.");
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let data: T;
  try { data = JSON.parse(cleaned) as T; }
  catch { throw new Error("The API returned invalid JSON. Please retry the request."); }
  return {
    data,
    content,
    usage: { input: result.usage?.input_tokens ?? result.usage?.prompt_tokens ?? 0, output: result.usage?.output_tokens ?? result.usage?.completion_tokens ?? 0 },
  };
}

/** Direct server-side API calls for the local web deployment. */
export class WebApiProvider implements AIProvider {
  readonly name = "pi" as const;

  async runJson<T>(prompt: string, schema: object, opts?: RunOptions) {
    const model = loadSettings().piModelFast;
    if (!model) throw new Error("No API model configured.");
    const result = await complete<T>([systemMessage(schema), { role: "user", content: prompt }], model, opts);
    return { data: result.data, usage: result.usage };
  }

  async runJsonInThread<T>(args: {
    outputSchema: object;
    opts?: RunOptions;
    resume?: { threadId: string; input: string };
    start?: { input: string };
  }) {
    const model = loadSettings().piModelSmart;
    if (!model) throw new Error("No API model configured.");
    if ((!args.start && !args.resume) || (args.start && args.resume)) throw new Error("Provide a new chat or a chat to resume.");
    const threadId = args.resume?.threadId ?? `web-${randomUUID()}`;
    const file = sessionPath(threadId);
    let messages: Message[] = [];
    if (args.resume) {
      try {
        messages = JSON.parse(await fs.readFile(file, "utf8")) as Message[];
        if (!Array.isArray(messages)) throw new Error("Invalid session");
      } catch {
        throw new Error("This chat session could not be loaded. Start a new chat.");
      }
    }
    messages = [systemMessage(args.outputSchema), ...messages.filter(message => message.role !== "system"), { role: "user", content: args.resume?.input ?? args.start!.input }];
    const result = await complete<T>(messages, model, args.opts);
    messages.push({ role: "assistant", content: result.content });
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(messages), "utf8");
    await fs.rename(temporary, file);
    return { data: result.data, usage: result.usage, threadId };
  }
}
