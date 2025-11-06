import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-recycle.jpg";
import { Camera, Upload, Recycle } from "lucide-react";

interface HeroProps {
  onStartClassifying: () => void;
}

export const Hero = ({ onStartClassifying }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Recyclable materials" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary">
            <Recycle className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          RecycleSmart
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
          AI-Powered Recycling Identification
        </p>

        <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
          Snap a photo or upload an image to instantly identify recyclable materials and learn the proper way to recycle them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="hero" 
            size="lg"
            onClick={onStartClassifying}
            className="text-lg px-8 py-6 h-auto"
          >
            <Camera className="mr-2 h-5 w-5" />
            Start Identifying
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={onStartClassifying}
            className="text-lg px-8 py-6 h-auto border-primary/30 hover:bg-primary/5"
          >
            <Upload className="mr-2 h-5 w-5" />
            Upload Image
          </Button>
        </div>

        {/* Stats/Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
            <div className="text-3xl font-bold text-primary mb-2">AI-Powered</div>
            <p className="text-muted-foreground">Advanced machine learning for accurate identification</p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
            <div className="text-3xl font-bold text-secondary mb-2">Instant</div>
            <p className="text-muted-foreground">Get results in seconds with our real-time analysis</p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
            <div className="text-3xl font-bold text-accent mb-2">Educational</div>
            <p className="text-muted-foreground">Learn proper recycling practices for each material</p>
          </div>
        </div>
      </div>
    </section>
  );
};
