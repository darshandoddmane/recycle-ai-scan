import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as tmImage from "@teachablemachine/image";

interface ClassificationResult {
  className: string;
  probability: number;
}

interface ImageClassifierProps {
  onBack: () => void;
}

export const ImageClassifier = ({ onBack }: ImageClassifierProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [usingCamera, setUsingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Teachable Machine model URL (demo URL - users can replace with their own)
  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/nY8P7mPe/";

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setUsingCamera(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try uploading an image instead.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUsingCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setImage(imageData);
        stopCamera();
        classifyImage(imageData);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setImage(imageData);
        classifyImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyImage = async (imageData: string) => {
    setIsLoading(true);
    setIsScanning(true);
    
    try {
      // Load the Teachable Machine model
      const modelURL = MODEL_URL + "model.json";
      const metadataURL = MODEL_URL + "metadata.json";
      
      const model = await tmImage.load(modelURL, metadataURL);
      
      // Create an image element to pass to the model
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Run the prediction
      const predictions = await model.predict(img);
      
      // Sort by probability and format results
      const sortedResults = predictions
        .sort((a, b) => b.probability - a.probability)
        .map(pred => ({
          className: pred.className,
          probability: pred.probability,
        }));

      setResults(sortedResults);
      
      toast({
        title: "Analysis Complete",
        description: "Material identified successfully!",
      });
    } catch (error) {
      console.error("Classification error:", error);
      toast({
        title: "Classification Error",
        description: "Unable to classify the image. Please try again with a different image.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsScanning(false), 500);
    }
  };

  const resetClassifier = () => {
    setImage(null);
    setResults([]);
    setIsScanning(false);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6"
        >
          ← Back to Home
        </Button>

        <Card className="p-6 md:p-8 shadow-xl border-border/50 backdrop-blur-sm bg-card/95">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Identify Recyclable Material
          </h2>

          {!image && !usingCamera && (
            <div className="space-y-4">
              <Button
                variant="hero"
                size="lg"
                onClick={startCamera}
                className="w-full text-lg py-6"
              >
                <Camera className="mr-2 h-5 w-5" />
                Use Camera
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-lg py-6 border-primary/30"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Image
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {usingCamera && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={captureImage}
                  className="flex-1"
                >
                  Capture Photo
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {image && (
            <div className="space-y-6 animate-fade-in">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img 
                  src={image} 
                  alt="Captured material" 
                  className="w-full h-auto"
                />
                
                {isScanning && (
                  <div className="absolute inset-0 bg-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/40 animate-scan" />
                  </div>
                )}
                
                {!isLoading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetClassifier}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isLoading && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Analyzing material...</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Classification Results</h3>
                  
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        index === 0 
                          ? 'bg-primary/5 border-primary' 
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-lg">{result.className}</span>
                        <span className={`text-sm font-medium ${
                          index === 0 ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {(result.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                          }`}
                          style={{ width: `${result.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={resetClassifier}
                    className="w-full mt-6"
                  >
                    Classify Another Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold mb-2 text-primary">💡 Using Your Own Model</h3>
          <p className="text-sm text-muted-foreground">
            This demo uses a sample Teachable Machine model. To use your own custom model, 
            train it at <a href="https://teachablemachine.withgoogle.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">teachablemachine.withgoogle.com</a>, 
            then update the MODEL_URL in the code with your model's URL.
          </p>
        </div>
      </div>
    </div>
  );
};
