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
