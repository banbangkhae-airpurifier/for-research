import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SECRET = process.env.JWT_SECRET!

interface RequireAuthProps {
  children: React.ReactNode
}

export default async function RequireAuth({ children }: RequireAuthProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  try {
    if (!token) throw new Error("No token")

    const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload
    if (!decoded.verified) {
      throw new Error("OTP not verified")
    }
  } catch {
    redirect("/login")
  }

  return <>{children}</>
}
