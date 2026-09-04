require('dotenv').config();

async function main() {
    const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.LLM_MODEL,
            messages: [
                { role: 'user', content: 'Reply with exactly one word: ready' }
            ]
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`LLM request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log(data.choices[0].message.content.trim());
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
