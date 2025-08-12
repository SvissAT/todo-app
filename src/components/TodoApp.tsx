"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAutoAnimate } from "@formkit/auto-animate/react"
import { useEffect, useMemo, useState } from "react"

interface TodoItem {
    id: string
    text: string
}

export default function TodoApp() {
    const [items, setItems] = useState<TodoItem[]>([])
    const [text, setText] = useState("")
    const [persistence, setPersistence] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [animationParent] = useAutoAnimate()

    useEffect(() => {
        let cancelled = false
        async function init() {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch("/api/todos", { cache: "no-store" })
                const data = await res.json()
                if (cancelled) return
                setPersistence(Boolean(data.persistence))
                setItems(Array.isArray(data.items) ? data.items : [])
            } catch (e: unknown) {
                if (cancelled) return
                setPersistence(false)
                setItems([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        init()
        return () => {
            cancelled = true
        }
    }, [])

    const canPersist = persistence === true

    async function addItem() {
        const trimmed = text.trim()
        if (!trimmed) return

        if (canPersist) {
            try {
                const res = await fetch("/api/todos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: trimmed }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.error || "Failed to add")
                setItems(data.items)
                setText("")
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Failed to add"
                setError(message)
            }
        } else {
            // Ephemeral: memory only (lost on refresh)
            setItems((prev) => [
                ...prev,
                { id: Math.random().toString(36).slice(2), text: trimmed },
            ])
            setText("")
        }
    }

    async function removeItem(id: string) {
        if (canPersist) {
            try {
                const res = await fetch("/api/todos", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.error || "Failed to delete")
                setItems(data.items)
            } catch (e: unknown) {
                const message =
                    e instanceof Error ? e.message : "Failed to delete"
                setError(message)
            }
        } else {
            setItems((prev) => prev.filter((t) => t.id !== id))
        }
    }

    const status = useMemo(() => {
        if (loading) return "Checking Redis..."
        if (persistence)
            return "Redis reachable. Items persist across refreshes."
        return "Redis not reachable."
    }, [loading, persistence])

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Simple ToDo
                </CardTitle>
                <p className="text-muted-foreground text-sm">{status}</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a task..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") addItem()
                        }}
                    />
                    <Button onClick={addItem} disabled={!text.trim()}>
                        Add
                    </Button>
                </div>
                <ul ref={animationParent} className="mt-4 space-y-2">
                    {items.map((t) => (
                        <li
                            key={t.id}
                            className="flex items-center justify-between rounded border p-2"
                        >
                            <span className="truncate">{t.text}</span>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeItem(t.id)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                    {items.length === 0 && (
                        <li className="text-muted-foreground text-sm">
                            No items yet
                        </li>
                    )}
                </ul>
            </CardContent>
        </Card>
    )
}
