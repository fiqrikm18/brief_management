# AI SDK `generateObject` → `generateText` Migration with Provider Fallback

**Date:** 2026-11-18
**Status:** Approved
**Scope:** `@core/` backend — brief AI analysis

## Problem

The AI SDK (v7.0.176) emits a deprecation warning on every brief analysis:

```
[AISDK_DEP_GENERENERATE_OBJECT] DeprecationWarning: AI SDK Warning:
Deprecated: "generateObject". Use generateText with an output setting instead.
```

`BriefService.executeAiAnalysis` calls `generateObject` (`src/modules/brief/application/brief.service.ts:44`).

Separately, AI analysis currently fails for every brief. Observed `ai_processing_results` rows:

| Time | Model | Error |
|---|---|---|
| 13:52, 13:53 | `gemini-2.5-flash` | `API key not valid` |
| 14:19 | `gemini-2.5-flash` | `This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash` |
| 14:22 | `gemini-3.8-flash` | `This model is currently experiencing high demand` (after 3 attempts) |

The model change to `gemini-3.8-flash` is already made in the working tree and is **correct** — the provider's own error message requires it. The remaining failure is transient provider overload, which the AI SDK's internal retries (3 attempts) do not absorb.

## Goals

1. Remove the `generateObject` deprecation warning by migrating to the supported API.
2. Keep the analysis contract identical: same prompt, same Zod schema, same fields persisted.
3. Add provider fallback so a transient Google failure does not permanently mark a brief `FAILED`.
4. Make the AI path unit-testable without a live provider.

## Non-goals

- No retry/backoff policy changes. The AI SDK already retries 3× internally per provider call; fallback is the selected resilience mechanism.
- No change to the `gemini-3.8-flash` model choice.
- No change to the public HTTP contract of `POST /api/briefs` or `POST /api/internal/briefs/:id/retry-ai`.
- No new runtime dependency.

## Design

### 1. Migration to `generateText` with an output setting

```ts
import { generateText, Output } from 'ai';

const result = await generateText({
  model: this.getAiModel(provider),
  output: Output.object({ schema: briefAiAnalysisSchema }),
  prompt,
});
const analysis = await result.output;
```

Notes:

- `Output` is exported at runtime by `ai@7.0.176` (`output_exports as Output`) with members `array`, `choice`, `json`, `object`, `text`. `Output.object({ schema })` accepts the project's Zod v4 schema and preserves the `.describe()` metadata as JSON Schema descriptions.
- `GenerateTextResult.output` is typed `PromiseLike<InferCompleteOutput<OUTPUT>>`, so it must be awaited separately from the `generateText` call.
- The error type changes from `NoObjectGeneratedError` to `NoOutputGeneratedError`. Both carry `.message`, so the existing `catch` block needs no change.

### 2. `AiModelFactory` (new, injectable)

New file `src/modules/brief/infrastructure/ai/ai-model.factory.ts`.

Responsibilities — the only place that knows how to build a model and whether a provider is usable:

- `create(provider: AiProvider): LanguageModelV4` — returns `google('gemini-3.8-flash')` or `openai('gpt-4o-mini')`.
- `isUsable(provider: AiProvider): boolean` — credential check (see §4).

Verified against the installed packages: `@ai-sdk/google@4.0.122` and `@ai-sdk/openai@4.0.121` both expose a callable provider returning `LanguageModelV4`. `openai(modelId)` targets the Responses API by default; `gpt-4o-mini` is accepted there.

`AiProvider` (`'google' | 'openai'`) moves to `src/modules/brief/domain/enums.domain.ts`, alongside the existing `PipelineStatus`, and is consumed by the service and by `RetryAiDto`. The Swagger DTO keeps its literal `enum: ['google', 'openai']` for schema generation.

Extracting the factory is what makes the fallback chain testable: `BriefService` depends on an injected factory, so a test can substitute models that throw or succeed on demand.

### 3. Provider chain

Configuration: `AI_PROVIDERS=google,openai` (comma-separated, ordered) in `.env`. When the variable is unset, the chain defaults to `google,openai`.

Chain construction for a request with primary provider `P`:

```
[P, ...configuredProviders.filter(p => p !== P)]
```

The `aiProvider` parameter (from `RetryAiDto.aiProvider`, or the `google` default) remains the **primary** provider; the remaining configured providers follow in configured order. This preserves the existing HTTP contract while making the fallback explicit.

Per provider, in order:

1. If `isUsable(provider)` is false → log a warning naming the missing/placeholder credential and **skip** (not counted as a failure).
2. Otherwise attempt `generateText`.
3. On success → `aiRepo.saveSuccess(...)` with the parsed analysis and return.
4. On failure → record `provider: message` and continue to the next provider.

Outcome:

- At least one provider succeeded → brief's AI result is `COMPLETED` (via `saveSuccess`).
- Every attempted provider failed → `aiRepo.markFailed(briefId, combinedMessage)` where `combinedMessage` joins attempts as `google: <error> | openai: <error>`.
- Every provider was skipped for missing credentials → `markFailed` with a message naming the missing credentials, so the operator sees the actionable cause rather than a provider error.
- The configured chain is empty (no providers configured at all) → `markFailed` with a message stating that no AI provider is configured. This cannot happen with the default chain, but the case is defined so the service never leaves an AI result stuck in `PENDING`.

`markPending` is called once before the chain starts, not once per provider.

### 4. Credential gating

A provider's API key is **usable** when it is present, does not contain `...`, and is at least 20 characters (`MIN_API_KEY_LENGTH`).

| Provider | Env var | Current `.env` value | Usable |
|---|---|---|---|
| google | `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSy…` (39 chars) | yes |
| openai | `OPENAI_API_KEY` | `sk-proj-...` (11 chars, placeholder) | **no** |

This gate is required, not cosmetic: without it the fallback would spend a real API call on the placeholder key and surface `API key not valid`, hiding the actual cause of the primary failure (`high demand`).

Once a real OpenAI key is supplied, no code change is needed — the provider becomes usable automatically.

## Testing

New file `src/modules/brief/application/brief.service.spec.ts` (Vitest, `globals: true` per `vitest.config.ts`).

The test injects a fake `AiModelFactory` whose `create()` returns a fake `LanguageModelV4`. The fake's `doGenerate` inspects the call options to determine what the AI SDK asked for (text content vs. tool call) and returns content matching that shape, so the test exercises the real `generateText` + `Output.object` pipeline rather than stubbing it out.

Cases:

1. Primary provider succeeds → `saveSuccess` called with the parsed analysis; fallback provider never used.
2. Primary provider throws → fallback provider is attempted; on its success `saveSuccess` is called with the fallback's analysis.
3. All providers throw → `markFailed` called once with a message containing both providers' errors.
4. A provider with unusable credentials is skipped → no call is made to it, and the chain continues to the next provider.

## Verification

1. `bun run test` — new unit tests pass; existing `app.controller.spec.ts` still passes.
2. `bun run lint` — no new warnings.
3. `bun run build` — compiles.
4. Live smoke test: `POST /api/briefs`, then poll `ai_processing_results` for the resulting brief. Expected: no deprecation warning in the server log, and an AI result that is `COMPLETED` (provider demand permitting) or `FAILED` with a combined message naming each attempted provider.

## Risks

- **Structured-output shape of the fake model.** The AI SDK may implement `Output.object` via native `responseFormat` or via a forced tool call, depending on provider capabilities. The fake model must match whichever the SDK uses. Resolved empirically during implementation by inspecting `doGenerate` call options.
- **Provider overload persists.** If Google remains under high demand and OpenAI has no real key, briefs still land in `FAILED` — but now with an accurate, actionable message instead of a misleading one.
