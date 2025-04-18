"use client";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const router = useRouter();
  return (
    <>
      <div className="flex-1 w-full flex flex-col gap-12">Leaderboard Page</div>
    </>
  );
}
