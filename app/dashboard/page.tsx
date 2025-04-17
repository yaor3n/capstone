"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default async function DashboardPage() {
  const router = useRouter();
  return (
    <>
      <div className="flex-1 w-full flex flex-col gap-12">Dashboard Page</div>
      <button onClick={() => router.push("/siasjdfjasdjf")}>redirect..</button>
    </>
  );
}
