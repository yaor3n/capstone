"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";

const PictureToPictureCreator = () => {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [publicVisibility, setPublicVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Pairs of images 4 pairs)
  const [pairs, setPairs] = useState(
    Array(4)
      .fill(null)
      .map(() => ({
        id: Math.random().toString(36).substring(2, 11),
        source: { src: null, file: null },
        target: { src: null, file: null },
      })),
  );
  const handleClear = () => {
    setQuizName("");
    setQuizDescription("");
    setCoverSrc(null);
    setCoverFile(null);
    setPublicVisibility(false);
    setPairs(
      Array(4)
        .fill(null)
        .map(() => ({
          id: Math.random().toString(36).substring(2, 11),
          source: { src: null, file: null },
          target: { src: null, file: null },
        })),
    );
    setExistingQuizId(null);
  };
  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      setCoverSrc(url);
      setCoverFile(file);
    } catch (err) {
      console.error("Cover upload failed:", err);
      alert("Please upload a valid image file");
    }
  };

  const handleCoverClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        const file = files[0];
        const url = URL.createObjectURL(file);
        setCoverSrc(url);
        setCoverFile(file);
      }
    };
    input.click();
  };

  const handleImageUpload = async (
    pairIndex: number,
    type: "source" | "target",
    file: File | null,
  ) => {
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      const newPairs = [...pairs];
      newPairs[pairIndex] = {
        ...newPairs[pairIndex],
        [type]: { src: url, file },
      };
      setPairs(newPairs);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Please upload a valid image file");
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    pairIndex: number,
    type: "source" | "target",
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageUpload(pairIndex, type, file);
  };

  const handleClickUpload = (pairIndex: number, type: "source" | "target") => {
    if (!fileInputRefs.current[pairIndex]) {
      fileInputRefs.current[pairIndex] = [];
    }
    const input = fileInputRefs.current[pairIndex][type === "source" ? 0 : 1];
    if (input) input.click();
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("quiz-images")
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("quiz-images").getPublicUrl(fileName);

    return publicUrl;
  };
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!quizName.trim() || !quizDescription.trim() || !coverFile) {
        alert("Please fill all required fields and upload a cover image");
        return;
      }

      const validPairs = pairs.filter(
        (pair) => pair.source.file && pair.target.file,
      );
      if (validPairs.length === 0) {
        alert("Please upload at least one complete pair of images");
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("You need to be logged in to create quizzes");
        return;
      }

      let quizId = existingQuizId;
      let quizCoverUrl = "";

      if (!existingQuizId) {
        quizCoverUrl = await uploadImageToSupabase(coverFile);

        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            user_id: user.id,
            name: quizName,
            description: quizDescription,
            public_visibility: publicVisibility,
            quiz_cover_url: quizCoverUrl,
          })
          .select("quiz_id")
          .single();

        if (quizError) throw quizError;
        quizId = quiz.quiz_id;
        setExistingQuizId(quizId);
      }

      // Process each valid pair
      for (const pair of validPairs) {
        if (!pair.source.file || !pair.target.file) continue;

        const sourceUrl = await uploadImageToSupabase(pair.source.file);
        const targetUrl = await uploadImageToSupabase(pair.target.file);

        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            quiz_id: quizId,
            question_type: "picture_to_picture",
            question_text: "Match the pairs",
            is_active: true,
          })
          .select("question_id")
          .single();

        if (questionError) throw questionError;

        // Create source option
        const { data: sourceOption, error: sourceError } = await supabase
          .from("question_options")
          .insert({
            question_id: question.question_id,
            option_text: "Source image",
            option_url: sourceUrl,
            is_correct: false,
            is_active: true,
          })
          .select("option_id")
          .single();

        if (sourceError) throw sourceError;

        // Create target option
        const { data: targetOption, error: targetError } = await supabase
          .from("question_options")
          .insert({
            question_id: question.question_id,
            option_text: "Target image",
            option_url: targetUrl,
            is_correct: false,
            is_active: true,
          })
          .select("option_id")
          .single();

        if (targetError) throw targetError;

        // Create match relationship
        const { error: matchError } = await supabase
          .from("question_matches")
          .insert({
            question_id: question.question_id,
            source_option_id: sourceOption.option_id,
            target_option_id: targetOption.option_id,
          });

        if (matchError) throw matchError;
      }

      alert("Quiz created successfully!");

      const addAnother = confirm(
        "Would you like to add another question to this quiz?",
      );

      if (addAnother) {
        // Clear only the image pairs while keeping quiz metadata
        setPairs(
          Array(4)
            .fill(null)
            .map(() => ({
              id: Math.random().toString(36).substring(2, 11),
              source: { src: null, file: null },
              target: { src: null, file: null },
            })),
        );
      } else {
        // If they don't want to add another, redirect to create page
        router.push("/create");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        `Failed to create quiz: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveClick = () => {
    if (
      confirm("Are you sure you want to leave? Unsaved changes will be lost.")
    ) {
      router.push("/create");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8d5] pb-40 pt-20">
      <h1 className="text-center text-3xl font-bold text-[#205781]">
        Create Picture to Picture Quiz
      </h1>

      {/* Cover Image Section */}
      <div className="space-y-4 px-4">
        <h2 className="text-center text-xl font-bold text-[#205781]">
          Quiz Cover Image
        </h2>
        <div
          onDrop={handleCoverDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleCoverClick}
          className="mx-auto flex h-64 w-[80%] cursor-pointer items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition hover:bg-[#98D2C0]"
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt="Cover preview"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <p className="text-lg font-medium">
              &#x2295; Click or drag & drop cover image
            </p>
          )}
        </div>
      </div>

      {/* Quiz Metadata */}
      <div className="mx-auto mt-8 flex w-[80%] flex-col gap-4 px-4 md:flex-row">
        <Input
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Quiz Name"
          className="border-[#205781] bg-[#f6f8d5] text-[#205781] hover:border-[#98D2C0]"
          disabled={!!existingQuizId}
        />
        <Input
          value={quizDescription}
          onChange={(e) => setQuizDescription(e.target.value)}
          placeholder="Quiz Description"
          className="border-[#205781] bg-[#f6f8d5] text-[#205781] hover:border-[#98D2C0]"
          disabled={!!existingQuizId}
        />
      </div>

      <div className="mx-auto mt-12 w-[90%] px-4">
        <h2 className="mb-6 text-center text-xl font-bold text-[#205781]">
          Create 6 Matching Pairs (Click to upload images)
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className="space-y-4 rounded-lg bg-white p-4 shadow-md"
            >
              <h3 className="text-center font-medium text-[#205781]">
                Pair {index + 1}
              </h3>

              <input
                type="file"
                accept="image/*"
                ref={(el) => {
                  if (!fileInputRefs.current[index])
                    fileInputRefs.current[index] = [];
                  fileInputRefs.current[index][0] = el;
                }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(index, "source", e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <input
                type="file"
                accept="image/*"
                ref={(el) => {
                  if (!fileInputRefs.current[index])
                    fileInputRefs.current[index] = [];
                  fileInputRefs.current[index][1] = el;
                }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(index, "target", e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div
                onDrop={(e) => handleDrop(e, index, "source")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleClickUpload(index, "source")}
                className="flex h-40 cursor-pointer items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition hover:bg-[#98D2C0]"
              >
                {pair.source.src ? (
                  <img
                    src={pair.source.src}
                    alt={`Source ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-sm font-medium">&#x2295; Source Image</p>
                )}
              </div>

              <div className="text-center text-lg font-bold text-[#205781]">
                ↓ Match to ↓
              </div>

              <div
                onDrop={(e) => handleDrop(e, index, "target")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => handleClickUpload(index, "target")}
                className="flex h-40 cursor-pointer items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition hover:bg-[#98D2C0]"
              >
                {pair.target.src ? (
                  <img
                    src={pair.target.src}
                    alt={`Target ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <p className="text-sm font-medium">&#x2295; Target Image</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-[80%] justify-center px-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="public-toggle"
            checked={publicVisibility}
            onCheckedChange={(c) => setPublicVisibility(!!c)}
            className="border-[#205781] data-[state=checked]:bg-[#205781]"
          />
          <Label htmlFor="public-toggle" className="text-[#205781]">
            Make quiz public
          </Label>
        </div>
      </div>

      <div className="mt-12 flex justify-center gap-6 bg-[#f6f8d5] pb-48">
        <Button
          type="button"
          onClick={handleLeaveClick}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          &#x2190; Leave
        </Button>
        <Button
          onClick={handleClear}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#F29898]"
        >
          &#x2715; Clear
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#205781] px-8 py-4 text-lg text-white hover:bg-[#154267]"
        >
          {isSubmitting ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </div>
  );
};

export default PictureToPictureCreator;
