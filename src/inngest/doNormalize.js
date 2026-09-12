const { inngest } = require('./client');
const bankNormalizer = require('../bank-normalizer/service');
const normalizeJobs = require('./normalizeJobs');

const doNormalize = inngest.createFunction(
    {
        id: 'do-normalize',
        triggers: { event: 'normalize/requested' },
        onFailure: async ({ event, error }) => {
            const { id } = event.data.event.data;
            normalizeJobs.update(id, { status: 'failed', error: error.message });
        }
    },
    async ({ event, step }) => {
        const { id, raw_name } = event.data;

        const result = await step.run('call-model', async () => {
            return bankNormalizer.normalize(raw_name);
        });

        await step.run('validate-and-save', async () => {
            normalizeJobs.update(id, { status: 'done', ...result });
        });

        return result;
    }
);

module.exports = { doNormalize };
