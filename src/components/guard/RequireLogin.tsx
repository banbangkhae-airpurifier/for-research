// app/components/RequireAuth.tsx
import * as jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SECRET = process.env.JWT_SECRET!

interface RequireAuthProps {
  children: React.ReactNode
}

export default async function RequireLogin({ children }: RequireAuthProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    if (!token) throw new Error("No token")

    jwt.verify(token, SECRET)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    redirect("/login")
  }

  return <>{children}</>
}
