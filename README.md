# Todo API

A simple Todo REST API built with Node.js and Express, backed by SQLite.

## Installation

Clone the project and install the dependencies:

```bash
npm install
```

## Run

Start the server with:

```bash
node server.js
```

The API runs at:

```
http://localhost:3002
```

Expected output:

```
Server is running on port 3002
```

## Endpoints

| Method | Endpoint     | Description                  | Body                    |
| ------ | ------------ | ----------------------------- | ------------------------ |
| GET    | `/`          | Check if the API is running   | None                     |
| GET    | `/tasks`     | Get all tasks                 | None                     |
| GET    | `/tasks/:id` | Get a task by ID              | None                     |
| POST   | `/tasks`     | Create a new task             | `{"title":"Buy milk"}`   |
| PUT    | `/tasks/:id` | Update a task                 | `{"title":"...","done":true}` |
| DELETE | `/tasks/:id` | Delete a task                 | None                     |

## Example: create a task

```bash
curl -i -X POST http://localhost:3002/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'
```

Expected output:

```
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}
```

## Swagger

The API is documented using OpenAPI. Visit `/docs` once the server is running to see interactive documentation for every endpoint.

### Swagger screenshot

![Swagger UI](./swagger-screenshot.png)

## Database

**Why SQLite:** SQLite was chosen because it needs no separate database server, it's a single file, which keeps the project simple for local development while still being real SQL rather than an in memory array.

**Where the database lives:** `tasks.db`, at the root of the project alongside `server.js`. It's created automatically on first run if it doesn't already exist, and the `tasks` table is created automatically if missing.

**How to run:**

```bash
node server.js
```

**Example query run by hand in DB Browser:**

```sql
SELECT * FROM tasks;
```

Output:

```
id  title                                done
2   Complete Todo App using Express     0
4   Learn SQL                           0
5   Learn SQL                           0
6   Learn SQL                           0
```

### Database viewer screenshot

![Database screenshot](./db-screenshot.png)


## Bank/PTSP Name Normalization

`POST /normalize` takes a messy, free-text bank or PTSP name — the kind you actually see in PTSA reporting data (misspellings, abbreviations, legal-entity suffixes) — and maps it to exactly one canonical name from a fixed list of nine values (`ACCESS BANK`, `GTBANK`, `UBA`, `ZENITH BANK`, `FIRST BANK`, `OPAY`, `MONIEPOINT`, `PALMPAY`, `OTHERS`). It never invents a name outside that list and never returns free text; when the input is ambiguous or refers to an entity not on the list, it returns `OTHERS` with confidence below 0.5 instead of guessing.

```bash
curl -i -X POST http://localhost:3002/normalize \
  -H "Content-Type: application/json" \
  -d '{"raw_name":"GT bank plc"}'
```

Expected output:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"canonical_name":"GTBANK","confidence":0.85,"reason":"GT bank plc is a common informal rendering of GTBank."}
```

**Job card:** see [job-card.md](./job-card.md).

**Provider/model:** OpenRouter, `minimax/minimax-m2.7:free`. The prompt lives in [prompts/normalize-v1.md](./prompts/normalize-v1.md) and is sent as the system message; the raw name is sent as the user message, never glued into the system prompt.

**Environment:** copy `.env.example` to `.env` and set `LLM_API_KEY` to your own OpenRouter key. `LLM_STUB=1` returns a hardcoded valid response with zero model calls (used for testing input validation and wiring). `LLM_ENABLED=false` is a kill switch that returns a safe `OTHERS`/confidence-0 fallback, also with zero model calls.

**Reliability:** requests time out at 30s. Only timeouts, 429s, and 5xxs are retried (exponential backoff with jitter, max 2 retries); 400/401/403 fail immediately. A model response that fails schema validation gets one repair retry (the broken output plus the exact validation error is sent back); if that also fails, the caller gets a clean 422 and the full exchange is appended to `logs/quarantine.jsonl` for review. Raw model text is never returned to the caller. Every call (tokens, duration, model, attempt count) is logged to `logs/llm-calls.jsonl`.

**Eval score:** 8/8 on `evals/cases.json`, run 2026-09-04 against `minimax/minimax-m2.7:free`. Run it yourself with `node evals/run.js`.

**Cost estimate at 10,000 requests/day:** the free-tier model costs $0 but is rate-limited and not suitable at this volume. On the paid tier of the same model (~458 prompt + ~176 completion tokens/call observed, $0.30/$1.20 per M tokens respectively), that's roughly $0.00035/call → **~$3.50/day (~$105/month)**. Switching to `openai/gpt-4o-mini` ($0.15/$0.60 per M tokens) drops that to roughly **~$1.75/day (~$52/month)** at the same token volume.

**What I'd fix with another day:** the repair-retry prompt re-sends the entire broken JSON and error inline as a user message rather than using the provider's structured-output/JSON-mode feature (not all OpenRouter models expose it consistently), which would make schema failures rarer in the first place instead of relying on a second round-trip.

## Persistence Verification

I verified that PostgreSQL data survives restarting the application
and database containers.

1. Started both containers:

   docker compose up -d --build

2. Created test tasks using the API:

   curl -i -X POST http://localhost:3002/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Test persistence"}'

   curl -i -X POST http://localhost:3002/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Restart containers"}'

3. Confirmed the tasks existed:

   curl -i http://localhost:3002/tasks

4. Restarted both actual containers:

   docker compose restart app postgres

5. Requested the tasks again:

   curl -i http://localhost:3002/tasks

6. The previously created tasks were still present.

7. I also tested persistence across container recreation:

   docker compose down
   docker compose up -d

8. I ran GET /tasks again and confirmed the tasks were still present.

The PostgreSQL data persisted because the database uses the named
`postgres_data` Docker volume mounted at `/var/lib/postgresql/data`.

9. Keep the postgres Config folder in the dir if you might want to resuse sqlite-3