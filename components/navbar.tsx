"use client";
import Link from "next/link";
import AuthButton from "./header-auth";
import useUserStore from "@/stores/useUserStore";

export default function Navbar({ role }: { role: string }) {
  const user = useUserStore((state) => state.user);
  console.log("som userrr", user);
  return (
    <nav className="flex w-full border-b p-4 text-sm font-semibold">
      <Link href="/">watch&learn</Link>
      <div className="space-x-4">
        {role === "student" && (
          <>
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
        <AuthButton />
      </div>
    </nav>
  );
}
