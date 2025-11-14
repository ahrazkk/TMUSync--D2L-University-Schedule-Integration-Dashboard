"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Calendar, 
  ExternalLink, 
  Save, 
  ArrowLeft, 
  Download, 
  Upload,
  Info,
  AlertCircle,
  CheckCircle,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [icsUrl, setIcsUrl] = useState("");
  const [currentIcsUrl, setCurrentIcsUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [storageStats, setStorageStats] = useState<any>(null);

  // Load current settings on mount
  useEffect(() => {
    loadCurrentSettings();
    loadStorageStats();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      // Load current ICS URL from setup API
      const response = await fetch('/api/setup', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.icsUrl) {
          setCurrentIcsUrl(data.icsUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStorageStats(data);
      }
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const handleSaveIcsUrl = async () => {
    if (!icsUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid ICS URL' });
      return;
    }

    if (!icsUrl.includes('.ics')) {
      setMessage({ type: 'error', text: 'URL must be a valid ICS calendar feed (ending with .ics)' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsUrl: icsUrl.trim() }),
      });

      if (response.ok) {
        setCurrentIcsUrl(icsUrl.trim());
        setIcsUrl(''); // Clear the input field
        setMessage({ type: 'success', text: 'D2L calendar URL updated successfully!' });
        loadStorageStats(); // Refresh stats
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearIcsUrl = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icsUrl: '' }),
      });

      if (response.ok) {
        setCurrentIcsUrl('');
        setIcsUrl('');
        setMessage({ type: 'info', text: 'D2L calendar URL cleared. You can set a new one anytime.' });
        loadStorageStats();
      } else {
        setMessage({ type: 'error', text: 'Failed to clear URL' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/assignments', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const exportData = {
          exportDate: new Date().toISOString(),
          completions: data,
          version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `university-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'Data exported successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account preferences and data</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <Card className={`border-l-4 ${
            message.type === 'success' ? 'border-l-green-500 bg-green-50' :
            message.type === 'error' ? 'border-l-red-500 bg-red-50' :
            'border-l-blue-500 bg-blue-50'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {message.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {message.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                <p className={
                  message.type === 'success' ? 'text-green-800' :
                  message.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }>{message.text}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* D2L Calendar Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              D2L Calendar Integration
            </CardTitle>
            <CardDescription>
              Configure your D2L calendar URL to sync assignments automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentIcsUrl && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-1">Current Calendar URL:</p>
                <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                  {currentIcsUrl.length > 60 ? `${currentIcsUrl.substring(0, 60)}...` : currentIcsUrl}
                </code>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">How to find your D2L Calendar URL:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Log into your D2L/Brightspace account</li>
                <li>Navigate to Calendar</li>
                <li>Look for "Subscribe" or "Calendar Feed" options</li>
                <li>Copy the ICS subscription URL (ends with .ics)</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ics-url">New D2L Calendar URL</Label>
              <Input
                id="ics-url"
                type="url"
                placeholder="https://d2l.youruni.edu/d2l/le/calendar/feed/user_123456.ics"
                value={icsUrl}
                onChange={(e) => setIcsUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleSaveIcsUrl} disabled={isLoading || !icsUrl.trim()}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Updating...' : 'Update Calendar URL'}
              </Button>
              
              {currentIcsUrl && (
                <Button variant="outline" onClick={handleClearIcsUrl} disabled={isLoading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Current URL
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and usage statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <code className="text-xs font-mono">{storageStats.currentUser?.substring(0, 16)}...</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Data Status</p>
                  <Badge variant={storageStats.hasData ? "default" : "secondary"}>
                    {storageStats.hasData ? 'Has Data' : 'No Data'}
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your assignment completion data is stored securely and syncs across browser contexts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or import your assignment completion data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Import Data (Coming Soon)
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>• Export includes all your assignment completions and settings</p>
              <p>• Data is automatically cleaned up after 90 days of inactivity</p>
              <p>• Your data syncs across all browser contexts when logged in</p>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>Get help with using the University Tracker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <a href="#" className="text-primary hover:underline text-sm">
                D2L Calendar Setup Guide
              </a>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <a href="#" className="text-primary hover:underline text-sm">
                Troubleshooting Common Issues
              </a>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              <a href="#" className="text-primary hover:underline text-sm">
                Privacy Policy & Data Usage
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}