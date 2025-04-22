"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const QuizTypePage = () => {
  const router = useRouter();
  return (
    <>
      <h1 className="pb-8 pt-8 text-center text-3xl font-bold text-[#205781] sm:pt-10 md:pt-16 md:text-3xl lg:pt-20 lg:text-4xl xl:pt-24 xl:text-5xl">
        Select a Quiz to Create
      </h1>
      <div className="m-4 grid grid-cols-1 gap-4 rounded-2xl border-[3px] border-[#205781] bg-[#98D2C0] p-6 sm:grid-cols-2 sm:p-8 md:grid-cols-3 md:p-10">
        <Button
          onClick={() => router.push("/create/slideshow")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Slide Show Question
        </Button>
        <Button
          onClick={() => router.push("/create/vidqn")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Video Question
        </Button>
        <Button
          onClick={() => router.push("/create/whichofimg")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Match Image Question
        </Button>
        <Button
          onClick={() => router.push("/create/pic2pic")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Picture to picture Question
        </Button>
        <Button
          onClick={() => router.push("/teacher/quiztype/dragndrop")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Drag & Drop Question
        </Button>
        <Button
          onClick={() => router.push("/teacher/quiztype/imghotspot")}
          className="w-full border-[3px] border-[#205781] bg-[#F6F8D5] p-10 text-lg font-bold text-[#205781] transition duration-300 ease-linear hover:bg-[#205781] hover:text-[#F6F8D5] sm:text-lg md:text-xl lg:text-2xl"
        >
          Create Image Hotspot Question
        </Button>
      </div>
    </>
  );
};

export default QuizTypePage;
