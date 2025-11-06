import { useState } from "react";
import { Hero } from "@/components/Hero";
import { ImageClassifier } from "@/components/ImageClassifier";

const Index = () => {
  const [showClassifier, setShowClassifier] = useState(false);

  return (
    <>
      {!showClassifier ? (
        <Hero onStartClassifying={() => setShowClassifier(true)} />
      ) : (
        <ImageClassifier onBack={() => setShowClassifier(false)} />
      )}
    </>
  );
};

export default Index;
