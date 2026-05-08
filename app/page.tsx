"use client"

import { Suspense } from "react"
import { AnonymousForum } from "@/components/forum/anonymous-forum"
import { Navbar } from "@/components/layout/navbar"
import { useSearchParams } from "next/navigation"

function ForumLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-muted/30 mx-auto mb-4 animate-pulse" />
        <div className="h-8 bg-muted/30 rounded w-48 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-muted/30 rounded w-64 mx-auto animate-pulse" />
      </div>
    </div>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const postId = searchParams.get("post")

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-24 pb-12">
        <Suspense fallback={<ForumLoading />}>
          <AnonymousForum initialPostId={postId || undefined} />
        </Suspense>
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24 pb-12">
          <ForumLoading />
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
