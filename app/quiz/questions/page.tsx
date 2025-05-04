"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function QuizQuestionsPage() {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newQuestion, setNewQuestion] = useState<string>("");

  const router = useRouter();
  const { quizid } = router.query;
  const supabase = createClient();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizid) return;

      setLoading(true);

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("quiz_id", quizid)
        .single();

      if (quizError) {
        console.error("Quiz fetch error:", quizError);
        setLoading(false);
        return;
      }

      console.log("Quiz Data:", quizData);
      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizid);

      if (questionsError) {
        console.error("Questions fetch error:", questionsError);
        setLoading(false);
        return;
      }

      console.log("Questions Data:", questionsData);
      setQuestions(questionsData);
      setLoading(false);
    };

    fetchQuizData();
  }, [quizid]);

  const handleCreateQuestion = () => {
    if (!newQuestion.trim()) return;

    const newQuestionData = {
      quiz_id: quizid,
      question: newQuestion,
      created_at: new Date().toISOString(),
    };

    supabase
      .from("questions")
      .insert([newQuestionData])
      .then(({ data, error }) => {
        if (error) {
          console.error("Error inserting question:", error);
          return;
        }

        setQuestions((prevQuestions) => [...prevQuestions, data[0]]);
        setNewQuestion("");
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-[#205781]">
        {quiz.name}
      </h1>
      <img
        src={quiz.quiz_cover_url}
        alt="Quiz Cover"
        className="mx-auto rounded-xl"
      />
      <p className="text-center text-lg text-gray-700">{quiz.description}</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[#205781]">Questions</h2>
        <div className="space-y-4">
          {questions.length > 0 ? (
            questions.map((question: any) => (
              <Card key={question.id} className="border-2 border-[#205781] p-4">
                <p className="text-lg">{question.question}</p>
                <Button
                  onClick={() =>
                    router.push(
                      `/quiz/${quizid}/questions/create/${question.id}`,
                    )
                  }
                  className="mt-2 w-full bg-[#205781] text-white"
                >
                  Edit Question
                </Button>
              </Card>
            ))
          ) : (
            <p>No questions available yet. Add a question to get started!</p>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <Input
            placeholder="New Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full border-2 border-[#205781]"
          />
          <Button
            onClick={handleCreateQuestion}
            className="h-10 bg-[#205781] text-white"
          >
            Add Question
          </Button>
        </div>
      </div>
    </div>
  );
}
