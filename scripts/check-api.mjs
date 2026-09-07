const endpoint = process.env.PI_URL?.replace(/\/$/, '');
const model = process.env.PI_MODEL_FAST;
if (!endpoint || !model || !process.env.PI_API_KEY) {
  console.error('API settings are missing from .env.local.');
  process.exit(1);
}
console.log(`Checking ${endpoint} with model ${model}...`);
try {
  const responses = process.env.PI_API_TYPE === 'openai-responses';
  const result = await fetch(`${endpoint}/${responses ? 'responses' : 'chat/completions'}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${process.env.PI_API_KEY}` },
    body: JSON.stringify(responses ? { model, input: 'Reply only OK.', max_output_tokens: 512, stream: false, store: false, reasoning: { effort: 'low' } } : { model, messages: [{ role: 'user', content: 'Reply only OK.' }], max_completion_tokens: 512, stream: false }),
    signal: AbortSignal.timeout(30000),
  });
  if (!result.ok) throw new Error(`API returned HTTP ${result.status}`);
  const body = await result.json();
  if (responses ? !body.output?.some(item => item.content?.some(part => part.type === 'output_text' && part.text)) : !body.choices?.[0]?.message?.content) throw new Error('API returned no chat response.');
  console.log('PASS: the API returned a chat response.');
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  console.error('If the request timed out, check that the API website is reachable from this computer.');
  process.exitCode = 1;
}
