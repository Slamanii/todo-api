const jobs = new Map();

function create(id, raw_name) {
    const job = { id, raw_name, status: 'pending' };
    jobs.set(id, job);
    return job;
}

function get(id) {
    return jobs.get(id);
}

function update(id, patch) {
    const job = jobs.get(id);
    if (!job) return undefined;
    Object.assign(job, patch);
    return job;
}

function counts() {
    const result = { pending: 0, done: 0, failed: 0 };
    for (const job of jobs.values()) {
        result[job.status] = (result[job.status] || 0) + 1;
    }
    return result;
}

module.exports = { create, get, update, counts };
