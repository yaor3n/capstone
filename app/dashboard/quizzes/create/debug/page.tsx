"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

const PicturePairsDebugger = () => {
  const supabase = createClient();
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        setLoading(true);

        // Fetch all questions of type picture_to_picture
        const { data: questions, error: questionsError } = await supabase
          .from("questions")
          .select("question_id, quiz_id")
          .eq("question_type", "picture_to_picture");

        if (questionsError) throw questionsError;
        if (!questions?.length) {
          setLoading(false);
          return;
        }

        // Fetch all matches for these questions
        const { data: matches, error: matchesError } = await supabase
          .from("question_matches")
          .select("question_id, source_option_id, target_option_id")
          .in(
            "question_id",
            questions.map((q) => q.question_id),
          );

        if (matchesError) throw matchesError;

        // Fetch all options (both sources and targets)
        const optionIds = matches.flatMap((m) => [
          m.source_option_id,
          m.target_option_id,
        ]);
        const { data: options, error: optionsError } = await supabase
          .from("question_options")
          .select("option_id, option_url, option_text")
          .in("option_id", optionIds);

        if (optionsError) throw optionsError;

        // Combine the data into pairs
        const combinedPairs = matches.map((match) => {
          const source = options.find(
            (o) => o.option_id === match.source_option_id,
          );
          const target = options.find(
            (o) => o.option_id === match.target_option_id,
          );
          const question = questions.find(
            (q) => q.question_id === match.question_id,
          );

          return {
            quiz_id: question?.quiz_id,
            question_id: match.question_id,
            source: source || null,
            target: target || null,
          };
        });

        setPairs(combinedPairs);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch pairs:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchPairs();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading pairs...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          Picture Pairs Debugger
        </h1>
        <div className="mb-6 flex justify-between">
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Refresh Data
          </Button>
          <div className="text-lg font-semibold">
            Total Pairs: {pairs.length}
          </div>
        </div>

        {pairs.length === 0 ? (
          <div className="rounded-lg bg-yellow-100 p-4 text-yellow-800">
            No picture pairs found in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
            {pairs.map((pair, index) => (
              <div
                key={`${pair.question_id}-${index}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex justify-between border-b pb-2">
                  <span className="font-medium">Quiz: {pair.quiz_id}</span>
                  <span className="text-sm text-gray-500">
                    Q: {pair.question_id}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 font-medium text-gray-700">
                      Source Image
                    </h3>
                    {pair.source ? (
                      <div className="space-y-1">
                        <img
                          src={pair.source.option_url}
                          alt={pair.source.option_text || "Source"}
                          className="h-40 w-full rounded border object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/image-placeholder.png";
                          }}
                        />
                        <p className="truncate text-sm text-gray-600">
                          {pair.source.option_text || "No description"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded border bg-gray-100 text-gray-400">
                        Missing source
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 font-medium text-gray-700">
                      Target Image
                    </h3>
                    {pair.target ? (
                      <div className="space-y-1">
                        <img
                          src={pair.target.option_url}
                          alt={pair.target.option_text || "Target"}
                          className="h-40 w-full rounded border object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/image-placeholder.png";
                          }}
                        />
                        <p className="truncate text-sm text-gray-600">
                          {pair.target.option_text || "No description"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded border bg-gray-100 text-gray-400">
                        Missing target
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PicturePairsDebugger;
