import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

interface RequireAuthProps {
  children: React.ReactNode
}

export default async function RequireLogin({ children }: RequireAuthProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <>{children}</>
}
