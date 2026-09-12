const { inngest } = require('./client');

const sayHello = inngest.createFunction(
    { id: 'say-hello', triggers: { event: 'test/say-hello' } },
    async ({ step }) => {
        await step.sleep('wait-5s', '5s');
        return 'hello from inngest';
    }
);

module.exports = { sayHello };
