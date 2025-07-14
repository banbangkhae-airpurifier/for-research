"use client"

import { useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // ถ้า session มี myJwt → เรียก /api/set-cookie → แล้ว redirect ไป /
  useEffect(() => {
    if (session?.myJwt) {
      fetch("/api/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: session.myJwt }),
      }).then(() => {
        router.replace("/")
      })
    }
  }, [session, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button onClick={() => signIn("google")}>
        Sign in with Google
      </Button>
    </div>
  )
}
