import { redis } from "bun"

export const dynamic = "force-dynamic"

export default async function Home() {
    const bingo = await redis.get("bingo")

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            Hello from Sviss Todo <br /> Running on {Bun.version}
            <p>Bingo: {bingo}</p>
        </main>
    )
}
