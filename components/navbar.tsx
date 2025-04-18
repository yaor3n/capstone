"use client";
import Link from "next/link";
import AuthButton from "./header-auth";
import useUserStore from "@/stores/useUserStore";

export default function Navbar({ role }: { role: string }) {
  const user = useUserStore((state) => state.user);
  console.log("som userrr", user);
  return (
    <nav className="flex justify-around items-center w-full border-b p-4 text-sm font-semibold">
      <Link href="/" className="text-center">
        watch&learn
      </Link>
      <div>
        {role === "student" && (
          <>
            <Link href="/appointments">Appointments</Link>
            <Link href="/appointments">Appointments</Link>
            <Link href="/appointments">Appointments</Link>
            <Link href="/appointments">Appointments</Link>
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
      </div>
      <AuthButton />
    </nav>
  );
}
