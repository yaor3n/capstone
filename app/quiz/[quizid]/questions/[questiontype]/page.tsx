// app/quiz/[quizid]/questions/[questiontype]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Slideshow from "@/components/questions/slideshow/page";
import ImgHotspot from "@/components/questions/imghotspot/page";
import Pic2Pic from "@/components/questions/pic2pic/page";
import VidQn from "@/components/questions/vidqn/page";
import WhichOfImg from "@/components/questions/whichofimg/page";
import DragNDrop from "@/components/questions/dragndrop/page";

export default function QuestionTypePage() {
  const params = useParams();
  const quizId = params.quizid as string;
  const questionType = params.questiontype as string;

  switch (questionType) {
    case "slideshow":
      return <Slideshow quizId={quizId} />;
    case "imghotspot":
      return <ImgHotspot quizId={quizId} />;
    case "pic2pic":
      return <Pic2Pic quizId={quizId} />;
    case "vidqn":
      return <VidQn quizId={quizId} />;
    case "whichofimg":
      return <WhichOfImg quizId={quizId} />;
    case "dragndrop":
      return <DragNDrop quizId={quizId} />;
    default:
      return <div>Invalid question type</div>;
  }
}
