import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { username, password } = await req.json()
  console.log(process.env.AUTH_USERNAME)


if (username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET!, { expiresIn: "1h" })
    const res = NextResponse.json({ message: "Logged in" })
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    })
    return res
  }

  return NextResponse.json({ error: `${process.env.AUTH_USERNAME}s Invalid credentials` }, { status: 401 })
}
