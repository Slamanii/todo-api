const fs = require('fs');
const path = require('path');
const { outputSchema } = require('./schema');
const llm = require('../llm/client');

const STUB_RESPONSE = {
    canonical_name: 'GTBANK',
    confidence: 0.95,
    reason: 'Stubbed response, no model call was made.'
};

const SYSTEM_PROMPT = llm.loadPrompt('normalize-v1');
const QUARANTINE_PATH = path.join(__dirname, '..', '..', 'logs', 'quarantine.jsonl');

const DISABLED_FALLBACK = {
    canonical_name: 'OTHERS',
    confidence: 0,
    reason: 'LLM_ENABLED is false; returning safe fallback without a model call.'
};

function validateInput(body) {
    const rawName = body && body.raw_name;

    if (typeof rawName !== 'string' || rawName.length < 1 || rawName.length > 100) {
        return { error: 'raw_name is required and must be a string between 1 and 100 characters' };
    }

    return { rawName };
}

function stripCodeFence(text) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return (fenced ? fenced[1] : text).trim();
}

function parseAndValidate(content) {
    const parsed = JSON.parse(stripCodeFence(content));
    return outputSchema.parse(parsed);
}

function logQuarantine(entry) {
    fs.mkdirSync(path.dirname(QUARANTINE_PATH), { recursive: true });
    fs.appendFileSync(QUARANTINE_PATH, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
}

async function normalize(rawName) {
    if (process.env.LLM_STUB === '1') {
        return outputSchema.parse(STUB_RESPONSE);
    }

    if (process.env.LLM_ENABLED === 'false') {
        return outputSchema.parse(DISABLED_FALLBACK);
    }

    const first = await llm.chat(SYSTEM_PROMPT, rawName, { purpose: 'initial' });

    try {
        return parseAndValidate(first.content);
    } catch (firstError) {
        const repairMessage = [
            `The raw name to classify was: "${rawName}"`,
            '',
            'Your previous response was invalid:',
            first.content,
            '',
            `Validation error: ${firstError.message}`,
            '',
            'Respond again with a single valid JSON object matching the required schema.'
        ].join('\n');

        const repair = await llm.chat(SYSTEM_PROMPT, repairMessage, { purpose: 'repair' });

        try {
            return parseAndValidate(repair.content);
        } catch (repairError) {
            logQuarantine({
                rawName,
                firstAttempt: first.content,
                firstError: firstError.message,
                repairAttempt: repair.content,
                repairError: repairError.message
            });

            const err = new Error('Model output failed validation after repair attempt');
            err.quarantined = true;
            throw err;
        }
    }
}

module.exports = { validateInput, normalize };
