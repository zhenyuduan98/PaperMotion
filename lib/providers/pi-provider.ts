import type { AIProvider, ProviderName, RunJsonInThreadResult, RunJsonResult, RunOptions } from "../provider-types";
import { runJsonPi, runJsonInThreadPi } from "../pi-coder";
import { loadSettings } from "../settings-store";
import { WebApiProvider } from "./web-api-provider";

const webApi = new WebApiProvider();
function shouldUseWebApi() {
  return process.env.GETIT_WEB === "1" && ["openai-completions", "openai-responses"].includes(loadSettings().piApiType ?? "");
}

export class PiProvider implements AIProvider {
  readonly name: ProviderName = "pi";

  async runJson<T>(
    prompt: string,
    outputSchema: object,
    opts?: RunOptions,
  ): Promise<RunJsonResult<T>> {
    if (shouldUseWebApi()) return webApi.runJson<T>(prompt, outputSchema, opts);
    return runJsonPi<T>(prompt, outputSchema, opts);
  }

  async runJsonInThread<T>(args: {
    outputSchema: object;
    opts?: RunOptions;
    resume?: { threadId: string; input: string };
    start?: { input: string };
  }): Promise<RunJsonInThreadResult<T>> {
    if (shouldUseWebApi()) return webApi.runJsonInThread<T>(args);
    return runJsonInThreadPi<T>(args);
  }
}
