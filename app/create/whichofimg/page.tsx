"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const WhichOfImg = () => {
  const router = useRouter();

  const [images, setImages] = useState<string[]>(new Array(4).fill(""));
  const [question, setQuestion] = useState("");

  const handleDrop = (index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const updatedImages = [...images];
        updatedImages[index] = reader.result as string;
        setImages(updatedImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  const handleSubmit = () => {
    const payload = {
      images: images,
      question: question,
    };
    console.log("Submitting Question:", payload);
  };

  const handleClear = () => {
    setImages(new Array(4).fill(""));
    setQuestion("");
  };

  return (
    <div className="bg-[#f6f8d5] pb-40 pt-20">
      <div className="mb-4 grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            onDrop={(e) => handleDrop(index, e)}
            onDragOver={handleDragOver}
            className="mx-auto flex h-40 w-[95%] cursor-pointer items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition duration-200 ease-linear hover:bg-[#98D2C0]"
          >
            {image ? (
              <img
                src={image}
                alt={`Dropped Image ${index + 1}`}
                className="max-h-full max-w-full"
              />
            ) : (
              <p className="text-lg font-medium">
                &#x2295; Drag & drop image here
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Label
          htmlFor="question"
          className="mb-2 block text-center text-2xl font-bold text-[#205781]"
        >
          Enter Question
        </Label>

        <Input
          id="question"
          type="text"
          value={question}
          onChange={handleQuestionChange}
          className="h-15 border-3 mx-auto w-[50%] border-[#205781] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
          placeholder="Example: How do i use nextjs 😭"
        />
      </div>

      <div className="flex justify-center gap-2 md:gap-3 lg:gap-6 xl:gap-10">
        <Button
          type="submit"
          onClick={() => router.push("/teacher/quiztype")}
          className="border-3 w-35 h-15 border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] hover:bg-[#98D2C0]"
        >
          &#x2713; Done
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          className="border-3 w-35 h-15 border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] hover:bg-[#98D2C0]"
        >
          &#x2295; Add
        </Button>
        <Button
          onClick={handleClear}
          className="border-3 w-35 h-15 border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] hover:bg-[#F29898]"
        >
          &#x2715; Clear
        </Button>
      </div>
    </div>
  );
};

export default WhichOfImg;
