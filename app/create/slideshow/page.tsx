"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

const SlideShowPage = () => {
  const router = useRouter();
  const supabase = createClient();

  // sum notes:
  // imageSrc: stores temporary local preview of dropped image using URL.createObjectURL
  // imageURL: actually stores the image's public URL
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);

  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverURL, setCoverURL] = useState<string | null>(null);

  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  // uploads the files to supabase under quiz-images bucket
  // then retreives public URL
  const uploadImage = async (file: File): Promise<string> => {
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

    return publicUrlData.publicUrl;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file && file.type.startsWith("image/")) {
      setImageSrc(URL.createObjectURL(file));
      uploadImage(file)
        .then((url) => {
          console.log("Image uploaded:", url);
          setImageURL(url);
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

  // by default,
  // elements block drop events so need to call preventDefault() to allow dropzone to accept files
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageSrc(URL.createObjectURL(file));
      uploadImage(file)
        .then((url) => {
          console.log("Image uploaded:", url);
          setImageURL(url);
        })
        .catch((err) => console.error("Upload failed", err));
    }
  };

  const handleFileCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

  const handleSubmit = async (isFinalSubmit: boolean) => {
    if (!imageURL) {
      console.error("No image uploaded");
      return;
    }

    const newQuizId = uuidv4();
    const joinCode = uuidv4();

    try {
      const { error: quizError } = await supabase.from("quizzes").insert([
        {
          quiz_id: newQuizId,
          user_id: "",
          name: "slideshow quiz",
          description: "skibidi quiz",
          public_visibility: true,
          join_code: joinCode,
          quiz_cover_url: imageURL,
          last_updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (quizError) {
        console.error("Error inserting quiz:", quizError.message);
        throw quizError;
      }

      const { error: questionError } = await supabase.from("questions").insert([
        {
          quiz_id: newQuizId,
          question_type: "slideshow",
          question_text: "What is this image?",
          image_urls: imageURL,
          video_url: "",
          updated_at: new Date().toISOString(),
          is_active: true,
        },
      ]);

      if (questionError) {
        console.error("Error inserting question:", questionError.message);
        throw questionError;
      }

      console.log("Quiz and question added successfully");

      if (isFinalSubmit) {
        router.push("/teacher/quiztype");
      }
    } catch (err) {
      console.error("Error submitting quiz and question", err);
    }
  };

  const handleClear = () => {
    setImageSrc(null);
    setImageURL(null);
    setCoverSrc(null);
    setCoverURL(null);
    setOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  };

  return (
    <div className="h-full bg-[#f6f8d5]">
      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Quiz Type: Slideshow Quiz
      </h1>

      <h1 className="pb-5 pt-7 text-center text-xl font-bold text-[#205781]">
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

      <div className="flex items-center justify-center">
        <Input
          className="h-15 w-[400px] border-[3px] border-[#205781] bg-[#f6f8d5] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
          placeholder="Enter quiz name"
        />
      </div>

      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Create Slideshow Quiz
      </h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="mx-auto flex h-64 w-[80%] items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition duration-200 ease-linear hover:bg-[#98D2C0]"
      >
        {imageSrc ? (
          <img src={imageSrc} alt="Dropped" className="max-h-full max-w-full" />
        ) : (
          <p className="text-lg font-medium">
            &#x2295; Drag & drop an image here!
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
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 pb-10 pl-10 pr-10 pt-5">
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

      <div className="flex items-center justify-center pb-10">
        <Checkbox className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]" />
        <Label className="pl-3 text-xl font-bold text-[#205781]">
          Make Public
        </Label>
      </div>

      <div className="flex justify-center gap-6 pb-48">
        <Button
          type="button"
          onClick={() => router.back()}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#f6f8d5] md:font-bold"
        >
          &larr; Back
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          className="w-35 h-15 border-[3px] border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#98D2C0]"
        >
          &#x2713; Done
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
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

export default SlideShowPage;
