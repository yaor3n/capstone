"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const VidQn = () => {
  const supabase = createClient();
  const router = useRouter();

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);

  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const uploadImage = async (
    file: File,
    isCover: boolean = false,
  ): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("quiz-images")
      .upload(fileName, file);

    if (error) {
      console.error("Image upload failed:", error.message);
      throw new Error("Image upload failed");
    }

    const { data: publicUrlData } = supabase.storage
      .from("quiz-images")
      .getPublicUrl(fileName);

    // Update the appropriate state based on whether it's a cover or question image
    if (isCover) {
      setCoverURL(publicUrlData.publicUrl);
    } else {
      setVideoURL(publicUrlData.publicUrl);
    }

    return publicUrlData.publicUrl;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file && file.type.startsWith("image/")) {
      setVideoSrc(URL.createObjectURL(file));
      uploadImage(file)
        .then((url) => {
          console.log("Image uploaded:", url);
          setVideoURL(url);
        })
        .catch((err) => console.error("Upload failed", err));
    }
  };
  const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file && file.type.startsWith("image/")) {
      setCoverSrc(URL.createObjectURL(file));
      uploadImage(file)
        .then((url) => {
          console.log("Image uploaded:", url);
          setCoverURL(url);
        })
        .catch((err) => console.error("Upload failed", err));
    }
  };

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoSrc(URL.createObjectURL(file));
    try {
      await uploadImage(file, false);
    } catch (err) {
      console.error("Question image upload failed", err);
    }
  };

  const handleFileCoverSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverSrc(URL.createObjectURL(file));
    try {
      await uploadImage(file, true);
    } catch (err) {
      console.error("Cover upload failed", err);
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const updatedOptions = [...options];
    updatedOptions[index].text = text;
    setOptions(updatedOptions);
  };

  const handleCheckbox = (index: number) => {
    const updatedOptions = [...options];
    updatedOptions.forEach((option, idx) => (option.isCorrect = idx === index));
    setOptions(updatedOptions);
  };

  const handleClear = () => {
    setVideoSrc(null);
    setVideoURL(null);
    // Don't clear cover image or quiz info
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
    setQuizQuestion(""); // Clear just the question text
  };

  // visibility
  const [publicVisibility, setPublicVisibility] = useState(false);

  // input fields
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");

  // done button
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const handleDone = async ({
    videoURL = null,
    coverURL = null,
    isFinalSubmit = false,
  }: {
    videoURL?: string | null;
    coverURL?: string | null;
    isFinalSubmit?: boolean;
  }) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      console.error("Auth error:", authError);
      return;
    }

    try {
      // Only create new quiz if we don't have an ID yet
      let quizId = currentQuizId;
      if (!quizId) {
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert([
            {
              user_id: authData.user.id,
              name: quizName,
              description: quizDescription,
              public_visibility: publicVisibility,
              join_code: Math.random().toString(36).substring(2, 8),
              quiz_cover_url: coverURL,
            },
          ])
          .select()
          .single();

        if (quizError) throw quizError;
        setCurrentQuizId(quiz.quiz_id);
        quizId = quiz.quiz_id;
      }

      // Insert question to the same quiz
      const { data: question, error: questionsError } = await supabase
        .from("questions")
        .insert([
          {
            quiz_id: quizId,
            question_type: "videoqn",
            question_text: quizQuestion,
            image_urls: null,
            video_url: videoURL,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (questionsError) throw questionsError;

      // Insert options
      const optionInserts = options.map((option) => ({
        question_id: question.question_id,
        option_text: option.text,
        is_correct: option.isCorrect,
        is_active: true,
      }));

      const { error: optionsError } = await supabase
        .from("question_options")
        .insert(optionInserts);

      if (optionsError) throw optionsError;

      handleClear(); // Clear question-specific fields only
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLeaveClick = () => {
    const confirmLeave = confirm(
      "You're about to leave this page!! Changes will not be saved :(\n\nClick OK to leave or Cancel to stay.",
    );

    if (confirmLeave) {
      router.push("/create");
    }
  };

  return (
    <div className="bg-[#f6f8d5]">
      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Quiz Type: Video Quiz
      </h1>

      <h1 className="pb-5 text-center text-xl font-bold text-[#205781]">
        Drop your quiz cover below!
      </h1>

      <div
        onDrop={handleCoverDrop}
        onDragOver={handleDragOver}
        className="mx-auto flex h-64 w-[80%] items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition duration-200 ease-linear hover:bg-[#98D2C0]"
      >
        {coverSrc ? (
          <img src={coverSrc} alt="Dropped" className="max-h-full max-w-full" />
        ) : (
          <p className="text-lg font-medium">
            &#x2295; Drag & drop an image here!
          </p>
        )}
      </div>

      <div className="flex justify-center gap-4 py-6">
        <Button
          className="w-auto border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition-all duration-300 ease-linear hover:bg-[#205781] hover:text-[#f6f8d5]"
          onClick={() => document.getElementById("fileCoverInput")?.click()}
        >
          &#128193; Browse Files
        </Button>
        <input
          id="fileCoverInput"
          type="file"
          accept="image/*"
          onChange={handleFileCoverSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <Input
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          className="h-15 w-[150px] border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0] md:w-[400px]"
          placeholder="Enter quiz name"
        />

        <Input
          value={quizDescription}
          onChange={(e) => setQuizDescription(e.target.value)}
          className="h-15 w-[150px] border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0] md:w-[400px]"
          placeholder="Enter quiz description"
        />
      </div>

      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Create Video Quiz
      </h1>

      <h1 className="pb-5 text-center text-xl font-bold text-[#205781]">
        Drop your question video below!
      </h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="mx-auto flex h-64 w-[80%] items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition duration-200 ease-linear hover:bg-[#98D2C0]"
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            alt="Dropped"
            className="max-h-full max-w-full"
          />
        ) : (
          <p className="text-lg font-medium">
            &#x2295; Drag & drop video here!
          </p>
        )}
      </div>

      <div className="flex justify-center gap-4 py-6">
        <Button
          className="w-auto border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition-all duration-300 ease-linear hover:bg-[#205781] hover:text-[#f6f8d5]"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          &#128193; Browse Files
        </Button>
        <input
          id="fileInput"
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="flex items-center justify-center bg-[#f6f8d5] pt-5">
        <Input
          value={quizQuestion}
          onChange={(e) => setQuizQuestion(e.target.value)}
          className="h-15 w-[150px] border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0] md:w-[400px]"
          placeholder="Enter quiz Question: (e.g. HOW DO I USE NEXTJS)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 bg-[#f6f8d5] pb-10 pl-10 pr-10 pt-5">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-4">
            <Input
              className="h-15 border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
              placeholder={`Option ${index + 1}`}
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            <Checkbox
              className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
              checked={option.isCorrect}
              onCheckedChange={() => handleCheckbox(index)}
            />
            <Label className="font-bold text-[#205781]">Set as Answer</Label>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center bg-[#f6f8d5] pb-10">
        <Checkbox
          checked={publicVisibility}
          onCheckedChange={(checked) => setPublicVisibility(!!checked)}
          className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
        />
        <Label className="pl-3 text-xl font-bold text-[#205781]">
          Make Public
        </Label>
      </div>

      <div className="flex justify-center gap-6 bg-[#f6f8d5] pb-48">
        <Button
          type="button"
          onClick={handleLeaveClick}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          &#x2190; Leave
        </Button>
        <Button
          type="button"
          onClick={() => {
            handleDone({ videoURL, coverURL, isFinalSubmit: false });
            alert(
              `Question added to "${quizName}"! Continue adding or click Leave to finish.`,
            );
          }}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          &#x2295; Add
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

export default VidQn;
