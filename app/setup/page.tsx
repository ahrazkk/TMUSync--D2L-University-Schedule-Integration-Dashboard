"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ExternalLink, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [icsUrl, setIcsUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetup = async () => {
    if (!icsUrl.trim()) {
      setError("Please enter your D2L calendar URL");
      return;
    }

    if (!icsUrl.includes(".ics")) {
      setError("Please enter a valid ICS calendar URL (should end with .ics)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsUrl: icsUrl.trim() }),
      });

      if (response.ok) {
        router.push('/');
        router.refresh(); // Refresh to ensure new settings are loaded
      } else {
        const data = await response.json();
        setError(data.error || "Setup failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Setup Your Calendar</CardTitle>
          <CardDescription>
            Connect your D2L calendar to track assignments automatically
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">How to find your D2L Calendar URL:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Log into your D2L/Brightspace account</li>
              <li>Go to Calendar → Subscribe</li>
              <li>Copy the ICS subscription URL</li>
              <li>Paste it below</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icsUrl">D2L Calendar URL</Label>
            <Input
              id="icsUrl"
              type="url"
              placeholder="https://d2l.youruni.edu/d2l/le/calendar/feed/user_123456.ics"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSetup} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Setting up..." : "Save & Continue"}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/')}
              disabled={isLoading}
            >
              Skip for now
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Need help finding your D2L calendar URL? 
              <a href="#" className="text-primary hover:underline">Guide</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
