// app/login/error/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Authentication Error</h1>
      <p className="mb-2">Oops! Something went wrong.</p>
      <p className="mb-4 text-sm text-gray-500">Error code: <strong>{error}</strong></p>
      <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">
        Back to Login
      </Link>
    </main>
  )
}
