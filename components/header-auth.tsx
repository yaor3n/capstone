"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import useUserStore from "@/stores/useUserStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthButton({
  closeMenuAction,
}: {
  closeMenuAction: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    closeMenuAction();
    clearUser();
    router.push("/sign-in"); // Redirect to the sign-in page after sign-out
  };

  const handleProfileClick = () => {
    router.push(`/dashboard`);
    closeMenuAction();
  };

  if (user) {
    return (
      <div className="flex gap-4 items-center">
        <div
          onClick={handleProfileClick}
          className="flex gap-2 p-2 cursor-pointer items-center rounded-lg hover:bg-gray-100 hover:text-black transition-all duration-200"
        >
          <Avatar>
            <AvatarImage src={user.pfp_url} alt={`@${user.username}`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-4">{user.username}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-red-500 hover:text-red-300"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  } else {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant="default">
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }
}
