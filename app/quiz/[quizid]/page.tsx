// app/quiz/[quizid]/page.tsx

import React from "react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const QuizPage = () => {
  const router = useRouter();
  const { quizid } = router.query;

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizid) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("quiz_id", quizid)
          .single(); // Fetch a single quiz by quizid

        if (error) {
          throw new Error(error.message);
        }

        setQuiz(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizid]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-[#205781]">
        {quiz?.name}
      </h1>
      <div className="text-center">
        <img
          src={quiz?.quiz_cover_url || "/default-cover.jpg"}
          alt="Quiz cover"
          className="max-h-64 max-w-full object-cover"
        />
      </div>
      <p className="text-center text-lg text-[#333]">{quiz?.description}</p>

      <div className="text-center">
        <button
          onClick={() => router.push(`/quiz/${quizid}/questions`)} // Redirect to questions page
          className="mt-6 h-10 w-40 rounded-lg bg-[#205781] font-semibold text-white"
        >
          Manage Questions
        </button>
      </div>
    </div>
  );
};

export default QuizPage;
