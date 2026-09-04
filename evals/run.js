require('dotenv').config();
const cases = require('./cases.json');
const service = require('../src/bank-normalizer/service');

async function main() {
    let passed = 0;
    const results = [];

    for (const testCase of cases) {
        const { rawName } = service.validateInput({ raw_name: testCase.raw_name });
        let result;
        let ok = false;

        try {
            result = await service.normalize(rawName);
            ok = result.canonical_name === testCase.expected;
        } catch (err) {
            result = { error: err.message };
        }

        if (ok) passed++;

        results.push({ input: testCase.raw_name, expected: testCase.expected, ...result, pass: ok });
    }

    for (const r of results) {
        const status = r.pass ? 'PASS' : 'FAIL';
        console.log(`[${status}] "${r.input}" -> expected ${r.expected}, got ${r.canonical_name || r.error} (confidence ${r.confidence ?? 'n/a'})`);
    }

    console.log(`\nScore: ${passed}/${cases.length}`);
}

main();
