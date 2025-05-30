"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Correct import for programmatic navigation
import AuthButton from "./user-profile";
import useUserStore from "@/stores/useUserStore";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { Geist } from "next/font/google";
import { usePathname } from "next/navigation";

const lato = Geist({
  subsets: ["latin"],
  weight: ["400", "700"], // Add other weights if needed
});

type Role = "student" | "lecturer" | "admin";

export default function Navbar() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links: Record<Role, Record<string, string>> = {
    student: {
      "/quiz": "Explore Quizzes",
      "/leaderboard": "Leaderboard",
    },
    lecturer: {
      "/dashboard": "Dashboard",
      "/schedule": "Schedule",
    },
    admin: {
      "/dashboard": "Admin Panel",
      "/users": "Users",
    },
  };

  const isValidRole = (role: string): role is Role => {
    return ["student", "lecturer", "admin"].includes(role);
  };

  const renderLinks = () => {
    if (!user?.role || !isValidRole(user?.role)) return null;

    return Object.entries(links[user.role as Role]).map(([href, label]) => {
      const isActive = pathname === href;
      return (
        <Link
          key={label}
          href={href}
          className={`rounded-lg px-2 py-1 text-lg transition-colors duration-200 ${isActive
              ? "text-white underline-offset-1 dark:text-gray-200"
              : "text-gray-400 hover:bg-white hover:text-black"
            }`}
          onClick={() => setIsMenuOpen(false)}
        >
          {label}
        </Link>
      );
    });
  };

  return (
    <nav
      className={`${lato.className} flex w-full items-center justify-between border-b px-10 py-3 text-sm font-semibold`}
    >
      {/* Logo */}
      <span
        className="cursor-pointer text-center text-lg font-bold"
        onClick={() => router.push("/")}
      >
        watch&learn
      </span>

      {/* Desktop Navigation */}
      <div className="hidden items-center gap-6 md:flex">{renderLinks()}</div>

      <div className="hidden md:block">
        <AuthButton closeMenuAction={() => setIsMenuOpen(false)} />
      </div>

      <button
        className="md:hidden"
        onClick={() => setIsMenuOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black bg-opacity-80 text-white">
          <button
            className="absolute right-6 top-6"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={30} />
          </button>

          {renderLinks()}
          <AuthButton closeMenuAction={() => setIsMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}
