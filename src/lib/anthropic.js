// Thin wrapper around the Anthropic Messages API.
// NOTE: Calling this from the browser exposes VITE_ANTHROPIC_API_KEY in the
// bundle. Once you build Edge Functions, route contract generation through
// supabase/functions/ instead and remove this file.

const API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Call Claude via the Anthropic Messages API.
 *
 * @param {object} opts
 * @param {{ role: 'user'|'assistant', content: string }[]} opts.messages
 * @param {string}  [opts.system]      - Optional system prompt
 * @param {number}  [opts.max_tokens]  - Default 1000
 * @param {string}  [opts.model]       - Default claude-sonnet-4-20250514
 * @returns {Promise<string>}          - The assistant's reply text
 */
export async function callClaude({
  messages,
  system,
  max_tokens = 1000,
  model = DEFAULT_MODEL,
}) {
  const body = { model, max_tokens, messages };
  if (system) body.system = system;

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-request-proxy': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Anthropic API error ${resp.status}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text ?? '';
}
