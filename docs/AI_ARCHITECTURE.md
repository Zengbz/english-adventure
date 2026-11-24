# AI Teaching Engine

## Fixed layers
1. Role prompts: base teacher role plus one task prompt (`tutor`, `speaking`, `writing`, `grammar`).
2. Context Engine: constructs a minimal task-specific payload from profile, current lesson, learning progress, recent conversation and optional user context.
3. Provider: DeepSeek Chat Completions API (`https://api.deepseek.com/chat/completions`).
4. JSON mode: `response_format: {"type":"json_object"}`.
5. Validator: parse JSON and validate required keys, types and enum values before UI rendering.

## API Key policy
The key is held only in a module-scoped JavaScript variable. It is not persisted. Refreshing the page clears it. Do not add key fields to progress export, logs, URLs, analytics, localStorage, IndexedDB, or service-worker caches.

## Context policy
Only send fields required by the active task. The context preview must show the exact payload. User-provided context is untrusted data and cannot override the system role or output contract. The app stores learning progress locally; when AI is used, selected context is transmitted to DeepSeek.

## Current limitation
DeepSeek JSON Output guarantees valid JSON syntax, not compliance with every application-specific schema. `EnglishAIContracts.validate()` is the final gate. Expand validators and tests whenever new task types are introduced.

## DeepSeek model/API note
The current default model ID is `deepseek-flash`; optional higher-capability model ID is `deepseek-v4-pro`. The app uses `/chat/completions` with `response_format: {"type":"json_object"}` and explicitly disables thinking for predictable, compact teaching responses. JSON mode guarantees JSON syntax, not the app's full schema; the local contract validator remains mandatory. See the official [Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/) and [JSON Output guide](https://api-docs.deepseek.com/guides/json_mode/).
