import { redis } from "bun"

export const dynamic = "force-dynamic"

interface TodoItem {
    id: string
    text: string
}

function json(data: unknown, init?: ResponseInit) {
    return Response.json(data, init)
}

async function isRedisAvailable(): Promise<boolean> {
    if (!Bun.env.REDIS_URL) return false // if no REDIS_URL is set, we can't use Redis
    try {
        await redis.ping()
        return true
    } catch {
        return false
    }
}

async function readTodos(): Promise<TodoItem[]> {
    const raw = await redis.get("todos")
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed as TodoItem[]
        return []
    } catch {
        return []
    }
}

async function writeTodos(items: TodoItem[]): Promise<void> {
    await redis.set("todos", JSON.stringify(items))
}

export async function GET() {
    const available = await isRedisAvailable()
    if (!available) {
        return json({ persistence: false, items: [] as TodoItem[] })
    }
    const items = await readTodos()
    return json({ persistence: true, items })
}

export async function POST(request: Request) {
    const available = await isRedisAvailable()
    if (!available) {
        return json(
            { error: "Redis is not available", persistence: false },
            { status: 503 },
        )
    }

    const body = (await request.json().catch(() => null)) as {
        text?: string
    } | null
    const text = body?.text?.toString().trim()
    if (!text) {
        return json({ error: "Missing text" }, { status: 400 })
    }

    const items = await readTodos()
    const newItem: TodoItem = { id: crypto.randomUUID(), text }
    items.push(newItem)
    await writeTodos(items)
    return json({ persistence: true, item: newItem, items })
}

export async function DELETE(request: Request) {
    const available = await isRedisAvailable()
    if (!available) {
        return json(
            { error: "Redis is not available", persistence: false },
            { status: 503 },
        )
    }

    const body = (await request.json().catch(() => null)) as {
        id?: string
    } | null
    const id = body?.id
    if (!id) {
        return json({ error: "Missing id" }, { status: 400 })
    }

    const items = await readTodos()
    const next = items.filter((t) => t.id !== id)
    if (next.length === items.length) {
        return json({ error: "Not found" }, { status: 404 })
    }
    await writeTodos(next)
    return json({ persistence: true, items: next })
}
