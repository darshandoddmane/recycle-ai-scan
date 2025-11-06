import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  is_recyclable: boolean;
  material_type: string;
  confidence: number;
  explanation: string;
}

interface ImageClassifierProps {
  onBack: () => void;
}

export const ImageClassifier = ({ onBack }: ImageClassifierProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [usingCamera, setUsingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

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
      console.log('Calling analyze-image function...');
      
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageData }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data || !data.analysis) {
        throw new Error('No analysis result received');
      }

      console.log('Analysis result:', data.analysis);
      setResult(data.analysis);
      
      toast({
        title: "Analysis Complete",
        description: data.analysis.is_recyclable 
          ? "This item is recyclable! ♻️" 
          : "This item is not recyclable.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Unable to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsScanning(false), 500);
    }
  };

  const resetClassifier = () => {
    setImage(null);
    setResult(null);
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

              {!isLoading && result && (
                <div className="space-y-4 animate-fade-in">
                  <div className={`p-6 rounded-lg border-2 ${
                    result.is_recyclable 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-500' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {result.is_recyclable ? (
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      )}
                      <h3 className="text-2xl font-bold">
                        {result.is_recyclable ? 'Recyclable ♻️' : 'Not Recyclable'}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-sm text-muted-foreground">Material Type:</span>
                        <p className="text-lg font-medium">{result.material_type}</p>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-sm text-muted-foreground">Confidence:</span>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                result.is_recyclable ? 'bg-green-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[3rem]">
                            {(result.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-sm text-muted-foreground">Explanation:</span>
                        <p className="mt-1 text-sm leading-relaxed">{result.explanation}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={resetClassifier}
                    className="w-full"
                  >
                    Scan Another Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold mb-2 text-primary">🤖 Powered by AI</h3>
          <p className="text-sm text-muted-foreground">
            This tool uses Google Gemini AI to analyze images and identify recyclable materials. 
            All images are securely stored and analyzed to help you make better recycling decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
