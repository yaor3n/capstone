"use client";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const router = useRouter();
  return (
    <>
      <div className="flex-1 w-full flex flex-col gap-12">Quiz Page</div>
    </>
  );
}
