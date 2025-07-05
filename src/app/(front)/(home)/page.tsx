// ไม่มี 'use client'
import RequireLogin from "@/components/RequireLogin"
import HomeClient from "./homeClient"

export default function HomePage() {
  return (
    <RequireLogin>
      <HomeClient />
    </RequireLogin>
  )
}