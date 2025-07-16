import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, otp } = await req.json()

  // เรียก API Express server เพื่อตรวจสอบ OTP
  const verifyRes = await fetch("http://localhost:6969/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp, email }),
  })

  const verifyData = await verifyRes.json()

  if (!verifyData.success) {
    return NextResponse.json(
      { success: false, error: verifyData.message || "Invalid OTP" },
      { status: verifyRes.status }
    )
  }

  // ถ้า OTP ถูกต้อง สร้าง JWT ให้เลย
  const jwt = (await import("jsonwebtoken")).default
  const myJwt = jwt.sign(
    { email, verified: true },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  )

  const res = NextResponse.json({ success: true })
  res.cookies.set("token", myJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  })

  return res
}
