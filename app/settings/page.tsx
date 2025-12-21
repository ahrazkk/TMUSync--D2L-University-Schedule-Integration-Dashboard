"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Calendar,
  Save,
  ArrowLeft,
  Info,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  Zap
} from "lucide-react";
import { saveAIConfig, getAIConfig, isAIConfigured } from "@/lib/ai-assistant";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAppearance } from "@/components/appearance-provider";

export default function SettingsPage() {
  const router = useRouter();
  const { preferences, updatePreferences, savePreferences } = useAppearance();

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ICS URLs state
  const [d2lIcsUrl, setD2lIcsUrl] = useState("");
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState("");
  const [currentD2lUrl, setCurrentD2lUrl] = useState("");
  const [currentGoogleUrl, setCurrentGoogleUrl] = useState("");

  // AI Settings state
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Load current settings on mount
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      // Load profile
      const profileRes = await fetch('/api/user/profile', { credentials: 'include' });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setFirstName(profileData.firstName || '');
        setEmail(profileData.email || '');
      }

      // Load ICS URLs
      const dataRes = await fetch('/api/user/data', { credentials: 'include' });
      if (dataRes.ok) {
        const data = await dataRes.json();
        if (data.icsUrls?.d2l) setCurrentD2lUrl(data.icsUrls.d2l);
        if (data.icsUrls?.googleCalendar) setCurrentGoogleUrl(data.icsUrls.googleCalendar);
      }

      // Load AI config from localStorage
      const aiConfig = getAIConfig();
      if (aiConfig.apiKey) {
        setGeminiApiKey(aiConfig.apiKey);
        setAiEnabled(true);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    // Validate password if changing
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          newPassword: newPassword || undefined,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsLoading(true);
    await savePreferences();
    setIsLoading(false);
    setMessage({ type: 'success', text: 'Appearance settings saved!' });
  };

  const handleSaveIcsUrls = async () => {
    if (d2lIcsUrl && !d2lIcsUrl.includes('.ics')) {
      setMessage({ type: 'error', text: 'D2L URL must be a valid ICS calendar feed' });
      return;
    }
    if (googleCalendarUrl && !googleCalendarUrl.includes('.ics') && !googleCalendarUrl.includes('calendar.google.com')) {
      setMessage({ type: 'error', text: 'Google Calendar URL must be a valid ICS feed' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          d2l: d2lIcsUrl.trim() || currentD2lUrl,
          googleCalendar: googleCalendarUrl.trim() || currentGoogleUrl
        }),
      });

      if (response.ok) {
        if (d2lIcsUrl.trim()) setCurrentD2lUrl(d2lIcsUrl.trim());
        if (googleCalendarUrl.trim()) setCurrentGoogleUrl(googleCalendarUrl.trim());
        setD2lIcsUrl('');
        setGoogleCalendarUrl('');
        setMessage({ type: 'success', text: 'Calendar URLs updated!' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/data", { method: "POST", credentials: 'include' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Data refreshed! Go to dashboard to see updates.' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to refresh' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUrl = async (type: 'd2l' | 'google') => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          d2l: type === 'd2l' ? '' : currentD2lUrl,
          googleCalendar: type === 'google' ? '' : currentGoogleUrl
        }),
      });
      if (response.ok) {
        if (type === 'd2l') setCurrentD2lUrl('');
        if (type === 'google') setCurrentGoogleUrl('');
        setMessage({ type: 'info', text: `${type === 'd2l' ? 'D2L' : 'Google Calendar'} URL cleared.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear URL' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAIConfig = () => {
    if (!geminiApiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid API key' });
      return;
    }

    saveAIConfig({ apiKey: geminiApiKey.trim() });
    setAiEnabled(true);
    setMessage({ type: 'success', text: 'AI configuration saved! The AI assistant is now enabled.' });
    setAiTestMessage(null);
  };

  const handleClearAIConfig = () => {
    saveAIConfig({ apiKey: '' });
    setGeminiApiKey('');
    setAiEnabled(false);
    setMessage({ type: 'info', text: 'AI configuration cleared.' });
    setAiTestMessage(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 md:w-8 md:h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground text-sm">Manage your account and calendar</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <Card className={`border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' :
            message.type === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' :
              'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
            }`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {message.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {message.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                <p className={
                  message.type === 'success' ? 'text-green-800 dark:text-green-200' :
                    message.type === 'error' ? 'text-red-800 dark:text-red-200' :
                      'text-blue-800 dark:text-blue-200'
                }>{message.text}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your name, email, and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Change Password
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Visual Appearance
            </CardTitle>
            <CardDescription>
              Customize the cinematic experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Aurora Intensity ({preferences.auroraIntensity}%)</Label>
                </div>
                <Slider
                  value={[preferences.auroraIntensity]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updatePreferences({ auroraIntensity: vals[0] })}
                />
                <p className="text-xs text-muted-foreground">Adjust the brightness of the background gradient mesh.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Film Grain Opacity ({preferences.noiseOpacity}%)</Label>
                </div>
                <Slider
                  value={[preferences.noiseOpacity]}
                  max={100}
                  step={1}
                  onValueChange={(vals) => updatePreferences({ noiseOpacity: vals[0] })}
                />
                <p className="text-xs text-muted-foreground">Control the texture strength giving the app a film look.</p>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label>Spotlight Effect</Label>
                  <p className="text-sm text-muted-foreground">Interactive flashlight cursor that reveals depth.</p>
                </div>
                <Switch
                  checked={preferences.enableSpotlight}
                  onCheckedChange={(checked) => updatePreferences({ enableSpotlight: checked })}
                />
              </div>
            </div>
            <Button onClick={handleSaveAppearance} disabled={isLoading} className="mt-4">
              <Save className="w-4 h-4 mr-2" />
              Save Appearance
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendar Integration
            </CardTitle>
            <CardDescription>Sync your schedule from D2L and Google Calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* D2L Section */}
            <div className="space-y-3">
              <h4 className="font-medium">D2L / Brightspace</h4>
              {currentD2lUrl && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <code className="text-xs break-all">{currentD2lUrl.substring(0, 60)}...</code>
                </div>
              )}
              <Input
                placeholder="https://d2l.youruni.edu/.../user_123.ics"
                value={d2lIcsUrl}
                onChange={(e) => setD2lIcsUrl(e.target.value)}
                disabled={isLoading}
              />
              {currentD2lUrl && (
                <Button variant="outline" size="sm" onClick={() => handleClearUrl('d2l')} disabled={isLoading}>
                  <Trash2 className="w-4 h-4 mr-2" /> Clear
                </Button>
              )}
            </div>

            <Separator />

            {/* Google Calendar Section */}
            <div className="space-y-3">
              <h4 className="font-medium">Google Calendar</h4>
              {currentGoogleUrl && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <code className="text-xs break-all">{currentGoogleUrl.substring(0, 60)}...</code>
                </div>
              )}
              <Input
                placeholder="https://calendar.google.com/.../basic.ics"
                value={googleCalendarUrl}
                onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                disabled={isLoading}
              />
              {currentGoogleUrl && (
                <Button variant="outline" size="sm" onClick={() => handleClearUrl('google')} disabled={isLoading}>
                  <Trash2 className="w-4 h-4 mr-2" /> Clear
                </Button>
              )}
            </div>

            <Separator />

            {/* Help */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
              <p><strong>D2L:</strong> Calendar → Subscribe → Copy ICS URL</p>
              <p><strong>Google:</strong> Settings → Calendar → Integrate → Secret address in iCal</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveIcsUrls} disabled={isLoading || (!d2lIcsUrl.trim() && !googleCalendarUrl.trim())}>
                <Save className="w-4 h-4 mr-2" />
                Save URLs
              </Button>
              <Button variant="outline" onClick={handleRefreshData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Configure AI-powered features using Gemini API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              {aiEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  <Bot className="w-3 h-3" />
                  Not configured
                </span>
              )}
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Gemini API Key</Label>
              <div className="relative">
                <Input
                  id="geminiApiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your Gemini API key..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers.
              </p>
            </div>

            {/* Help Text */}
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground space-y-1">
              <p><strong>How to get an API key:</strong></p>
              <p>1. Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></p>
              <p>2. Click "Create API Key"</p>
              <p>3. Copy and paste it here</p>
            </div>

            {/* AI Features */}
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2">AI Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Smart assignment priority detection</li>
                <li>Automatic course linking</li>
                <li>Study time estimation</li>
                <li>AI-generated descriptions</li>
                <li>Chat assistant for schedule questions</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveAIConfig} disabled={!geminiApiKey.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save API Key
              </Button>
              {aiEnabled && (
                <Button variant="outline" onClick={handleClearAIConfig}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Ideas */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>• <strong>Notifications:</strong> Coming soon</p>
            <p>• <strong>Default View:</strong> Coming soon</p>
            <p>• <strong>Assignment Reminders:</strong> Coming soon</p>
            <p>• <strong>Export Data:</strong> Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}