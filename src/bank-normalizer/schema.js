const { z } = require('zod');

const CANONICAL_NAMES = [
    'ACCESS BANK',
    'GTBANK',
    'UBA',
    'ZENITH BANK',
    'FIRST BANK',
    'OPAY',
    'MONIEPOINT',
    'PALMPAY',
    'OTHERS'
];

const outputSchema = z.object({
    canonical_name: z.enum(CANONICAL_NAMES),
    confidence: z.number().min(0).max(1),
    reason: z.string().min(1)
}).strict();

module.exports = { CANONICAL_NAMES, outputSchema };
