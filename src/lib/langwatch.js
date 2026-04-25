const API_KEY = import.meta.env.VITE_LANGWATCH_API_KEY;
const ENDPOINT = import.meta.env.VITE_LANGWATCH_ENDPOINT ?? "https://app.langwatch.ai";

// Generates a UUID without importing Node.js crypto
function uid() {
  return crypto.randomUUID();
}

/**
 * createTrace — wraps a single LLM interaction and ships it to LangWatch.
 *
 * Usage:
 *   const trace = createTrace({ feature: "advisor", metadata: { lang: "nl" } });
 *   const span = trace.startLLMSpan("debt-advisor");
 *   // ... make fetch call ...
 *   await span.end({ model, systemPrompt, messages, output, usage });
 */
export function createTrace({ feature, metadata = {} }) {
  const traceId = uid();

  return {
    traceId,
    startLLMSpan(name) {
      const spanId = uid();
      const startedAt = Date.now();

      return {
        async end({ model, systemPrompt, messages = [], output, usage = {}, error }) {
          const finishedAt = Date.now();

          // Build input as chat_messages array (system + conversation)
          const inputMessages = [];
          if (systemPrompt) inputMessages.push({ role: "system", content: systemPrompt });
          inputMessages.push(...messages);

          const span = {
            span_id: spanId,
            trace_id: traceId,
            name,
            type: "llm",
            model,
            input: { type: "chat_messages", value: inputMessages },
            output: error
              ? null
              : { type: "chat_messages", value: [{ role: "assistant", content: output }] },
            timestamps: { started_at: startedAt, finished_at: finishedAt },
            params: { max_tokens: usage.max_tokens },
            metrics: {
              prompt_tokens: usage.input_tokens,
              completion_tokens: usage.output_tokens,
            },
            error: error ? { message: error.message ?? String(error) } : undefined,
          };

          await _send({
            trace_id: traceId,
            metadata: { feature, ...metadata },
            spans: [span],
          });
        },
      };
    },
  };
}

async function _send(payload) {
  if (!API_KEY) {
    console.warn("[LangWatch] VITE_LANGWATCH_API_KEY not set — traces disabled.");
    return;
  }
  try {
    await fetch(`${ENDPOINT}/api/collector`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Never block the user experience for observability failures
    console.warn("[LangWatch] Failed to send trace:", err.message);
  }
}
