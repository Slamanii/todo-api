const fs = require('fs');
const path = require('path');

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

const CALL_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'llm-calls.jsonl');

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
    if (err.name === 'AbortError') return true;
    if (err.status === 429) return true;
    if (err.status >= 500) return true;
    return false;
}

function logCall(entry) {
    fs.mkdirSync(path.dirname(CALL_LOG_PATH), { recursive: true });
    fs.appendFileSync(CALL_LOG_PATH, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
}

async function attemptChat(systemPrompt, userMessage) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const start = Date.now();

    try {
        const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.LLM_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const durationMs = Date.now() - start;

        if (!res.ok) {
            const text = await res.text();
            const err = new Error(`LLM request failed: ${res.status} ${text}`);
            err.status = res.status;
            err.durationMs = durationMs;
            throw err;
        }

        const data = await res.json();

        return {
            content: data.choices[0].message.content,
            usage: data.usage || null,
            model: data.model || process.env.LLM_MODEL,
            durationMs
        };
    } catch (err) {
        if (err.name === 'AbortError') {
            err.durationMs = Date.now() - start;
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

async function chat(systemPrompt, userMessage, meta = {}) {
    let lastErr;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await attemptChat(systemPrompt, userMessage);

            logCall({
                ...meta,
                attempt,
                status: 'ok',
                model: result.model,
                durationMs: result.durationMs,
                promptTokens: result.usage ? result.usage.prompt_tokens : null,
                completionTokens: result.usage ? result.usage.completion_tokens : null,
                totalTokens: result.usage ? result.usage.total_tokens : null
            });

            return result;
        } catch (err) {
            lastErr = err;

            logCall({
                ...meta,
                attempt,
                status: 'error',
                httpStatus: err.status || (err.name === 'AbortError' ? 'timeout' : null),
                durationMs: err.durationMs || null,
                message: err.message
            });

            if (!isRetryable(err) || attempt === MAX_RETRIES) {
                throw err;
            }

            const backoff = BASE_DELAY_MS * (2 ** attempt) + Math.random() * 250;
            await sleep(backoff);
        }
    }

    throw lastErr;
}

function loadPrompt(name) {
    return fs.readFileSync(path.join(__dirname, '..', '..', 'prompts', `${name}.md`), 'utf8');
}

module.exports = { chat, loadPrompt };
