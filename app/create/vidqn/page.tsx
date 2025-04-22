"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const VidQn = () => {
  const router = useRouter();
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = () => setVideoSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  const [correctAnsIndex, setCorrectAnsIndex] = useState<number | null>(null);

  const handleCheckbox = (index: number) => {
    setCorrectAnsIndex(index);
  };

  return (
    <div className="bg-[#f6f8d5]">
      <h1 className="pb-5 pt-7 text-center text-3xl font-bold text-[#205781]">
        Create Video Quiz
      </h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="mx-auto flex h-64 w-[80%] items-center justify-center rounded-xl border-4 border-dashed border-[#205781] text-center text-[#205781] transition duration-200 ease-linear hover:bg-[#98D2C0]"
      >
        {videoSrc ? (
          <video src={videoSrc} className="max-h-full max-w-full" />
        ) : (
          <p className="text-lg font-medium">
            &#x2295; Drag & drop video here!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 p-10">
        <div className="flex items-center gap-4">
          <Input
            className="h-15 border-3 border-[#205781] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
            placeholder="Option 1"
          />
          <Checkbox
            className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
            checked={correctAnsIndex === 0}
            onCheckedChange={() => handleCheckbox(0)}
          />
          <Label className="font-bold text-[#205781]">Set as Answer</Label>
        </div>

        <div className="flex items-center gap-4">
          <Input
            className="h-15 border-3 border-[#205781] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
            placeholder="Option 1"
          />
          <Checkbox
            className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
            checked={correctAnsIndex === 1}
            onCheckedChange={() => handleCheckbox(1)}
          />
          <Label className="font-bold text-[#205781]">Set as Answer</Label>
        </div>

        <div className="flex items-center gap-4">
          <Input
            className="h-15 border-3 border-[#205781] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
            placeholder="Option 1"
          />
          <Checkbox
            className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
            checked={correctAnsIndex === 2}
            onCheckedChange={() => handleCheckbox(2)}
          />
          <Label className="font-bold text-[#205781]">Set as Answer</Label>
        </div>

        <div className="flex items-center gap-4">
          <Input
            className="h-15 border-3 border-[#205781] font-bold text-[#205781] transition-all duration-200 ease-linear hover:border-[#98d2c0]"
            placeholder="Option 1"
          />
          <Checkbox
            className="fg-[#f6f8d5] border-[2px] border-[#205781] data-[state=checked]:border-[#205781] data-[state=checked]:bg-[#205781]"
            checked={correctAnsIndex === 3}
            onCheckedChange={() => handleCheckbox(3)}
          />
          <Label className="font-bold text-[#205781]">Set as Answer</Label>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <Button
          type="submit"
          onClick={() => router.push("/teacher/quiztype")}
          className="border-3 w-35 h-15 border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] hover:bg-[#98D2C0]"
        >
          &#x2713; Done
        </Button>
        <Button
          type="submit"
          className="border-3 w-35 h-15 border-[#205781] bg-[#f6f8d5] text-xl font-bold text-[#205781] hover:bg-[#98D2C0]"
        >
          &#x2295; Add
        </Button>
      </div>
    </div>
  );
};

export default VidQn;
