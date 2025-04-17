// components/navbar.tsx
import Link from "next/link";

export default function Navbar({ role }: { role: string }) {
  return (
    <nav className="flex justify-between p-4 border-b">
      <Link href="/">🏠 watch&learn</Link>
      <div className="space-x-4">
        {role === "student" && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/appointments">Appointments</Link>
          </>
        )}
        {role === "lecturer" && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/schedule">Schedule</Link>
          </>
        )}
        {role === "admin" && (
          <>
            <Link href="/dashboard">Admin Panel</Link>
            <Link href="/users">Users</Link>
          </>
        )}
        <Link href="/logout">Logout</Link>
      </div>
    </nav>
  );
}
