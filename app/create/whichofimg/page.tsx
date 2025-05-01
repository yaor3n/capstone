"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";

const WhichOfImg = () => {
  const router = useRouter();
  const supabase = createClient();

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [publicVisibility, setPublicVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);

  // For the 4 answer images
  const [answerImages, setAnswerImages] = useState<
    { src: string | null; file: File | null; isCorrect: boolean }[]
  >(Array(4).fill({ src: null, file: null, isCorrect: false }));
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const bucket = "quiz-images";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return publicUrl;
  };

  const handleDone = async () => {
    setIsSubmitting(true);
    try {
      // Validate all fields
      if (
        !quizName.trim() ||
        !quizDescription.trim() ||
        !quizQuestion.trim() ||
        !coverURL ||
        answerImages.some((img) => !img.file) ||
        !answerImages.some((img) => img.isCorrect)
      ) {
        alert(
          "Please fill all fields, upload all images, and select a correct answer",
        );
        return;
      }

      const answerUrls = await Promise.all(
        answerImages.map((img) => (img.file ? uploadImage(img.file) : "")),
      );

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        alert("You need to be logged in to create quizzes");
        return;
      }

      let quizId = existingQuizId;

      // 1. Save quiz metadata (only if new quiz)
      if (!existingQuizId) {
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert([
            {
              user_id: user.id,
              name: quizName,
              description: quizDescription,
              public_visibility: publicVisibility,
              join_code: Math.random().toString(36).substring(2, 8),
              quiz_cover_url: coverURL,
            },
          ])
          .select("quiz_id")
          .single();

        if (quizError) throw quizError;
        quizId = quiz.quiz_id;
        setExistingQuizId(quizId);
      }

      // 2. Save question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert([
          {
            quiz_id: quizId,
            question_type: "which_of_images",
            question_text: quizQuestion,
            is_active: true,
          },
        ])
        .select("question_id")
        .single();

      if (questionError) throw questionError;

      // 3. Save answer options
      const { error: optionsError } = await supabase
        .from("question_options")
        .insert(
          answerImages.map((img, index) => ({
            question_id: question.question_id,
            option_text: `Option ${index + 1}`,
            option_url: answerUrls[index],
            is_correct: img.isCorrect,
            is_active: true,
          })),
        );

      if (optionsError) throw optionsError;

      alert("Question added successfully!");

      // Ask user if they want to add another question
      const addAnother = confirm(
        "Would you like to add another question to this quiz?",
      );

      if (addAnother) {
        // Clear only question-specific fields
        setQuizQuestion("");
        setAnswerImages(
          Array(4).fill({ src: null, file: null, isCorrect: false }),
        );
      } else {
        router.push("/create");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      setCoverSrc(url);
      const publicUrl = await uploadImage(file);
      setCoverURL(publicUrl);
    } catch (err) {
      console.error("Cover upload failed:", err);
      alert("Cover upload failed");
    }
  };

  const handleAnswerImageUpload = async (index: number, file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      const newAnswerImages = [...answerImages];
      newAnswerImages[index] = { src: url, file, isCorrect: false };
      setAnswerImages(newAnswerImages);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Please upload a valid image file");
    }
  };

  const handleSetCorrectAnswer = (index: number) => {
    const newAnswerImages = answerImages.map((img, i) => ({
      ...img,
      isCorrect: i === index,
    }));
    setAnswerImages(newAnswerImages);
  };

  const handleClear = () => {
    setCoverSrc(null);
    setCoverURL(null);
    setQuizName("");
    setQuizDescription("");
    setQuizQuestion("");
    setPublicVisibility(false);
    setAnswerImages(Array(4).fill({ src: null, file: null, isCorrect: false }));
    setExistingQuizId(null);
  };

  const handleLeaveClick = () => {
    if (
      confirm(
        "Are you sure you want to leave? All unsaved changes will be lost.",
      )
    ) {
      router.push("/create");
    }
  };

  return (
    <div className="bg-[#f6f8d5] pb-40 pt-20">
      <div className="space-y-4 px-4">
        <h1 className="text-center text-3xl font-bold text-[#205781]">
          Create Which of the Image Quiz
        </h1>

        <h2 className="text-center text-xl font-bold text-[#205781]">
          Quiz Cover Image
        </h2>
        <div
          onDrop={handleCoverDrop}
          onDragOver={(e) => e.preventDefault()}
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
        <div className="flex justify-center gap-4">
          <Button
            className="border-[3px] border-[#205781] bg-[#f6f8d5] text-[#205781] hover:bg-[#205781] hover:text-[#f6f8d5]"
            onClick={() => document.getElementById("coverInput")?.click()}
          >
            Browse Cover
          </Button>
          <input
            id="coverInput"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                const url = URL.createObjectURL(file);
                setCoverSrc(url);
                const publicUrl = await uploadImage(file);
                setCoverURL(publicUrl);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

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
          Upload 4 Answer Images (Click to mark as correct)
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {answerImages.map((image, index) => (
            <div
              key={index}
              className={`relative h-64 cursor-pointer rounded-xl border-4 ${image.isCorrect ? "border-green-500" : "border-[#205781]"}`}
              onClick={() => handleSetCorrectAnswer(index)}
            >
              {image.src ? (
                <>
                  <img
                    src={image.src}
                    alt={`Answer option ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleAnswerImageUpload(index, e.target.files[0]);
                      }
                    }}
                  />
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <label className="flex cursor-pointer flex-col items-center">
                    <span className="text-lg font-medium text-[#205781]">
                      &#x2295; Add Image {index + 1}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => (fileInputRefs.current[index] = el)}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAnswerImageUpload(index, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
              {image.isCorrect && (
                <div className="absolute bottom-2 left-2 rounded-full bg-green-500 px-3 py-1 text-white">
                  Correct
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex justify-center pl-36 pr-36 pt-10">
        <Input
          value={quizQuestion}
          onChange={(e) => setQuizQuestion(e.target.value)}
          placeholder="Enter your question (e.g. 'Which of these is correct?')"
          className="border-[#205781] bg-[#f6f8d5] text-[#205781] hover:border-[#98D2C0]"
        />
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
          type="button"
          onClick={handleDone}
          disabled={isSubmitting}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          {isSubmitting ? "Adding..." : "\u2295 Add"}
        </Button>
        <Button
          onClick={handleClear}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#F29898]"
        >
          &#x2715; Clear
        </Button>
      </div>
    </div>
  );
};

export default WhichOfImg;
