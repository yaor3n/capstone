"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import useUserStore from "@/stores/useUserStore";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const clearUser = useUserStore((state) => state.clearUser);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push("/sign-in");
  };

  return (
    <>
      <div className="flex w-full flex-1 flex-col gap-12">Dashboard Page</div>
      <button onClick={handleSignOut}>sign out</button>
    </>
  );
}
