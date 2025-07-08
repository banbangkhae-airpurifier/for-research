// ไม่มี 'use client'
import RequireLogin from "@/components/guard/RequireLogin"
import HomeClient from "@/components/pages/homeClient"

export default function HomePage() {
  return (
    <RequireLogin>
      <HomeClient />
    </RequireLogin>
  )
}