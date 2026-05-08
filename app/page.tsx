import { AnonymousForum } from "@/components/forum/anonymous-forum"
import { Navbar } from "@/components/layout/navbar"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-12">
        <AnonymousForum />
      </div>
    </main>
  )
}
