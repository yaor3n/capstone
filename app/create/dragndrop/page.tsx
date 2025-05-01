"use client";
import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const DragAndDropQuiz = () => {
  const router = useRouter();
  const supabase = createClient();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);

  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [publicVisibility, setPublicVisibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Answer options
  const [options, setOptions] = useState([
    { id: 1, text: "", isCorrect: false },
    { id: 2, text: "", isCorrect: false },
    { id: 3, text: "", isCorrect: false },
  ]);

  // Hotspots with associated option IDs
  const [hotspots, setHotspots] = useState([
    { x: 25, y: 25, optionId: null },
    { x: 50, y: 50, optionId: null },
    { x: 75, y: 75, optionId: null },
  ]);

  const imageRef = useRef<HTMLImageElement>(null);

  const uploadImage = async (
    file: File,
    isCover: boolean = false,
  ): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const bucket = "quiz-images";
    let imageFile = file;

    if (!isCover) {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;
      const targetAspect = 16 / 9;

      let cropWidth = originalWidth;
      let cropHeight = cropWidth / targetAspect;

      if (cropHeight > originalHeight) {
        cropHeight = originalHeight;
        cropWidth = cropHeight * targetAspect;
      }

      const cropX = (originalWidth - cropWidth) / 2;
      const cropY = (originalHeight - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
      }

      ctx.drawImage(
        imageBitmap,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg"),
      );

      if (!blob) {
        console.error("Canvas toBlob failed");
        return null;
      }

      imageFile = new File([blob], file.name, { type: "image/jpeg" });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload failed:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const [existingQuizId, setExistingQuizId] = useState<string | null>(null);
  const handleDone = async ({
    isFinalSubmit = false,
  }: { isFinalSubmit?: boolean } = {}) => {
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (
        !quizName.trim() ||
        !quizDescription.trim() ||
        !imageURL ||
        !coverURL
      ) {
        const missingFields = [];
        if (!quizName.trim()) missingFields.push("Quiz Name");
        if (!quizDescription.trim()) missingFields.push("Description");
        if (!imageURL) missingFields.push("Question Image");
        if (!coverURL) missingFields.push("Cover Image");

        alert(
          `Please fill all required fields. Missing: ${missingFields.join(", ")}`,
        );
        return;
      }

      // Validate all options have text
      if (options.some((option) => !option.text.trim())) {
        alert("Please fill in all answer options");
        return;
      }

      // Validate at least one option is marked as correct
      if (!options.some((option) => option.isCorrect)) {
        alert("Please mark one option as correct by clicking on it");
        return;
      }

      // Validate all hotspots have an option assigned
      if (hotspots.some((hotspot) => hotspot.optionId === null)) {
        alert("Please assign all options to hotspots by dragging them");
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error(
          "Authentication Error:",
          authError?.message || "No user found",
        );
        alert(
          "You need to be logged in to create quizzes. Please sign in and try again.",
        );
        return;
      }

      let quizId: string;
      let questionId: string;

      // 1. Save quiz metadata
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

        if (quizError) {
          console.error("Quiz Creation Error:", quizError);
          throw new Error(`Failed to create quiz: ${quizError.message}`);
        }
        quizId = quiz.quiz_id;
        setExistingQuizId(quizId);
      } else {
        quizId = existingQuizId;
      }

      // 2. Save question with image
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert([
          {
            quiz_id: quizId,
            question_type: "drag_and_drop",
            question_text:
              quizQuestion || "Match the options to the correct spots",
            image_urls: imageURL,
            video_url: null,
            is_active: true,
          },
        ])
        .select("question_id")
        .single();

      if (questionError) {
        console.error("Question Creation Error:", questionError);
        await supabase.from("quizzes").delete().eq("quiz_id", quizId);
        throw new Error(`Failed to create question: ${questionError.message}`);
      }
      questionId = question.question_id;

      // 3. Save all options and their hotspot positions
      for (const option of options) {
        const hotspot = hotspots.find((h) => h.optionId === option.id);
        if (!hotspot) continue;

        const { error: optionsError } = await supabase
          .from("question_options")
          .insert([
            {
              question_id: questionId,
              option_text: option.text,
              pos_x: Math.round(hotspot.x),
              pos_y: Math.round(hotspot.y),
              is_correct: option.isCorrect,
              is_active: true,
            },
          ]);

        if (optionsError) {
          console.error("Option Creation Error:", optionsError);
          await supabase
            .from("questions")
            .delete()
            .eq("question_id", questionId);
          await supabase.from("quizzes").delete().eq("quiz_id", quizId);
          throw new Error(`Failed to save option: ${optionsError.message}`);
        }
      }

      const continueAdding = confirm(
        `Question saved successfully!\n\nClick OK to add another question to this quiz, or Cancel to finish.`,
      );

      if (isFinalSubmit || !continueAdding) {
        router.push("/create");
      } else {
        // Clear only question-specific fields while keeping quiz info
        setImageSrc(null);
        setImageURL(null);
        setQuizQuestion("");
        setOptions([
          { id: 1, text: "", isCorrect: false },
          { id: 2, text: "", isCorrect: false },
          { id: 3, text: "", isCorrect: false },
        ]);
        setHotspots([
          { x: 25, y: 25, optionId: null },
          { x: 50, y: 50, optionId: null },
          { x: 75, y: 75, optionId: null },
        ]);
      }
    } catch (error) {
      console.error("Submission error:", {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
        quizName,
        hasImage: !!imageURL,
        hasCover: !!coverURL,
      });
      alert(
        `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      const publicUrl = await uploadImage(file);
      setImageURL(publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed");
    }
  };

  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;

    try {
      const url = URL.createObjectURL(file);
      setCoverSrc(url);
      const publicUrl = await uploadImage(file, true);
      setCoverURL(publicUrl);
    } catch (err) {
      console.error("Cover upload failed:", err);
      alert("Cover upload failed");
    }
  };

  const handleClear = () => {
    setImageSrc(null);
    setImageURL(null);
    setCoverSrc(null);
    setCoverURL(null);
    setQuizQuestion("");
    setOptions([
      { id: 1, text: "", isCorrect: false },
      { id: 2, text: "", isCorrect: false },
      { id: 3, text: "", isCorrect: false },
    ]);
    setHotspots([
      { x: 25, y: 25, optionId: null },
      { x: 50, y: 50, optionId: null },
      { x: 75, y: 75, optionId: null },
    ]);
  };

  const handleOptionChange = (id: number, text: string) => {
    setOptions(
      options.map((option) =>
        option.id === id ? { ...option, text } : option,
      ),
    );
  };

  const toggleCorrectOption = (id: number) => {
    setOptions(
      options.map((option) => ({
        ...option,
        isCorrect: option.id === id,
      })),
    );
  };

  const handleHotspotDrop = (hotspotIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    const optionId = parseInt(e.dataTransfer.getData("optionId"));

    setHotspots(
      hotspots.map((hotspot, index) =>
        index === hotspotIndex
          ? { ...hotspot, optionId }
          : hotspot.optionId === optionId
            ? { ...hotspot, optionId: null }
            : hotspot,
      ),
    );
  };

  const handleOptionDragStart = (optionId: number, e: React.DragEvent) => {
    e.dataTransfer.setData("optionId", optionId.toString());
  };

  const handleLeaveClick = () => {
    if (
      confirm("Are you sure you want to leave? Unsaved changes will be lost.")
    ) {
      router.push("/create");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5d5]">
      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Quiz Type: Drag and Drop Quiz
      </h1>

      {/* Cover Image Upload (same as before) */}
      <div className="space-y-4">
        <h2 className="text-center text-xl font-bold text-[#205781]">
          Drop your quiz cover below!
        </h2>
        <div
          onDrop={handleCoverDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mx-auto flex h-64 w-[80%] items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition hover:bg-[#98D2C0]"
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt="Cover preview"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <p className="text-lg font-medium">
              &#x2295; Drag & drop cover image
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
                await handleCoverDrop({
                  dataTransfer: { files: [e.target.files[0]] },
                  preventDefault: () => {},
                } as unknown as React.DragEvent<HTMLDivElement>);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Quiz Name and Description */}
      <div className="mx-auto mt-8 flex w-[80%] flex-col gap-4 md:flex-row">
        <Input
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Quiz Name"
          className="border-[#205781] bg-[#f6f8d5] text-[#205781] hover:border-[#98D2C0]"
        />
        <Input
          value={quizDescription}
          onChange={(e) => setQuizDescription(e.target.value)}
          placeholder="Quiz Description"
          className="border-[#205781] bg-[#f6f8d5] text-[#205781] hover:border-[#98D2C0]"
        />
      </div>

      {/* Answer Options */}
      <div className="mx-auto mt-8 w-[80%] space-y-4">
        <h2 className="text-center text-xl font-bold text-[#205781]">
          Answer Options (click to mark as correct)
        </h2>
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-4">
            <div
              draggable
              onDragStart={(e) => handleOptionDragStart(option.id, e)}
              className={`flex-1 cursor-move rounded-lg p-3 ${
                option.isCorrect ? "bg-green-200" : "bg-white"
              }`}
              onClick={() => toggleCorrectOption(option.id)}
            >
              <Input
                value={option.text}
                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                placeholder={`Option ${option.id}`}
                className="border-[#205781] bg-transparent text-[#205781] hover:border-[#98D2C0]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Drag and Drop Area */}
      <div className="mt-8 space-y-4">
        <h2 className="text-center text-xl font-bold text-[#205781]">
          Drag and Drop Question
        </h2>
        <div className="mx-auto w-[90%] max-w-[800px] overflow-hidden rounded-xl border-4 border-dashed border-[#205781] bg-[#f6f8d5]">
          <div className="relative aspect-[16/9] w-full">
            {imageSrc ? (
              <div
                className="relative h-full w-full"
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Question image"
                  className="h-full w-full object-cover"
                />
                {hotspots.map((hotspot, index) => (
                  <div
                    key={index}
                    className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                      hotspot.optionId ? "bg-green-500" : "bg-blue-500"
                    } flex items-center justify-center text-white`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                    }}
                    onDrop={(e) => handleHotspotDrop(index, e)}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {hotspot.optionId ? (
                      <span className="font-bold">{hotspot.optionId}</span>
                    ) : (
                      <span className="text-xs">Drop here</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <p className="text-lg font-medium text-[#205781]">
                  &#x2295; Drag & drop question image
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            className="border-[3px] border-[#205781] bg-[#f6f8d5] text-[#205781] hover:bg-[#205781] hover:text-[#f6f8d5]"
            onClick={() => document.getElementById("questionInput")?.click()}
          >
            Browse Question Image
          </Button>
          <input
            id="questionInput"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                await handleImageDrop({
                  dataTransfer: { files: [e.target.files[0]] },
                  preventDefault: () => {},
                } as unknown as React.DragEvent<HTMLDivElement>);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Question Input */}
      <div className="mt-4 flex justify-center">
        <Input
          value={quizQuestion}
          onChange={(e) => setQuizQuestion(e.target.value)}
          className="w-[80%] border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
          placeholder="Enter quiz question (e.g. 'Drag the options to the correct spots')"
        />
      </div>

      {/* Public Toggle */}
      <div className="mt-6 flex justify-center">
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

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center gap-4 pb-12">
        <Button
          onClick={handleLeaveClick}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          ← Leave
        </Button>
        <Button
          onClick={() => handleDone({ isFinalSubmit: false })}
          disabled={!imageURL || !coverURL || isSubmitting}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          {isSubmitting ? "Saving..." : "Add Question"}
        </Button>
        <Button
          onClick={handleClear}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#F29898]"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

export default DragAndDropQuiz;
