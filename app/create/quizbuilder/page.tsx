"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* general flow:
 * on create page, once create button is clicked it will send quiz metadata to db
 * on this page it will check how many questions were previously entered
 * and sort them into an array of ??
 * then in each question it will have a drop down, so users can select from 6 quizzes
 * users will be redirected to the respective question making pages,
 * on those pages once done is clicked it will get quiz metadata from here or create/ page
 * then upload it to db, sending back the question metadata like question id etc for display
 *
 * ou also need to preserve no. of qns so every question creation page
 * needs to always push that number
 * every page should have ts router.push(`/create/quizbuilder?quizId=${quizId}&questionNum=${questionNum}`);

 **/

// removing questions:
// jus set is_active in questions table to false lul

export default function QuizBuilder() {
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");
  const [quiz, setQuiz] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  // Retrieve the number of questions from local storage
  const questionNum = parseInt(localStorage.getItem("questionNum") || "0", 10);
  const questionsArray = Array.from({ length: questionNum }, (_, i) => i + 1);

  const questionId = searchParams.get("questionId");
  const questionText = searchParams.get("questionText");

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("quiz_id", quizId)
        .single();

      if (error) {
        console.error("Failed to fetch quiz:", error);
        return;
      }

      setQuiz(data);
      setLoading(false);
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) return <p>Loading quiz...</p>;
  if (!quiz) return <p>Quiz not found</p>;

  const finallyDone = () => {
    const confirmExit = window.confirm("sure u wanna leave?");
    if (confirmExit) {
      localStorage.removeItem("questionNum");
      router.push("/create");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {questionsArray.map((qNum) => (
        <div
          key={qNum}
          className="rounded-lg border border-gray-300 p-4 shadow-sm"
        >
          <h2 className="mb-2 text-lg font-semibold text-[#205781]">
            Question {qNum}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Select Question Type</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/slideshow?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Slideshow Question
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/vidqn?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Video Question
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/imghotspot?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Image Hotspot
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/whichofimg?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Which of Images
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/pic2pic?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Picture to Picture
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/create/dragndrop?quizId=${quizId}&questionNum=${qNum}`,
                  )
                }
              >
                Drag & Drop
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <div className="flex justify-center">
        <Button
          onClick={finallyDone}
          className="w-25 h-10 border-[2px] border-[#205781] bg-[#f6f8d5] text-lg font-semibold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#f6f8d5]"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
