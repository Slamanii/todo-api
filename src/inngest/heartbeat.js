const { inngest } = require('./client');
const normalizeJobs = require('./normalizeJobs');

const heartbeat = inngest.createFunction(
    { id: 'normalize-heartbeat', triggers: { cron: '* * * * *' } },
    async () => {
        const counts = normalizeJobs.counts();
        console.log(`[normalize-heartbeat] pending=${counts.pending} done=${counts.done} failed=${counts.failed}`);
        return counts;
    }
);

module.exports = { heartbeat };
