import TodoApp from "@/components/TodoApp"

export const dynamic = "force-dynamic"

export default function Home() {
    return (
        <main className="flex flex-col items-center gap-6 p-8">
            <div className="text-center">
                <h1 className="text-2xl font-semibold">Sviss ToDo</h1>
                <p className="text-muted-foreground text-sm">
                    Running on {Bun.version}
                </p>
                <p className="text-muted-foreground text-sm">
                    Hello {process.env.NAME || "World"}!
                </p>
            </div>
            <TodoApp />
        </main>
    )
}
