'use client'
import { Home, Fan, LayoutDashboard } from "lucide-react"
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around py-3">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Home className={`w-5 h-5 ${pathname === '/' ? 'text-blue-500' : 'text-gray-600'}`} />
          <span className={`text-xs ${pathname === '/' ? 'text-blue-500' : 'text-gray-600'}`}>
            Home
          </span>
        </Link>
        <Link href="/devices" className="flex flex-col items-center gap-1">
          <Fan className={`w-5 h-5 ${pathname === '/devices' ? 'text-blue-500' : 'text-gray-600'}`} />
          <span className={`text-xs ${pathname === '/devices' ? 'text-blue-500' : 'text-gray-600'}`}>
            Devices
          </span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <LayoutDashboard className={`w-5 h-5 ${pathname === '/dashboard' ? 'text-blue-500' : 'text-gray-600'}`} />
          <span className={`text-xs ${pathname === '/dashboard' ? 'text-blue-500' : 'text-gray-600'}`}>
            Dashboard
          </span>
        </Link>
      </div>
    </div>
  );
}