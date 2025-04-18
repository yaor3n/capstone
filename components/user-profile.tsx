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
      <div className="flex items-center gap-4">
        <div
          onClick={handleProfileClick}
          className="flex cursor-pointer items-center gap-4 rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 hover:text-black"
        >
          <div className="align-center flex flex-col items-end">
            <span>{user.username}</span>
            <span className="text-xs text-gray-500">{user.role}</span>
          </div>
          <Avatar>
            <AvatarImage src={user.pfp_url} alt={`@${user.username}`} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
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
