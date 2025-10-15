"use client"

import { useState, useEffect } from "react";
import { userAPI } from "@/lib/api";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Check } from "lucide-react"

export default function SlackConfigPage() {
  const [slackBotToken, setSlackBotToken] = useState("")
  const [slackBotId, setSlackBotId] = useState("")
  const [slackChannel, setSlackChannel] = useState("")
  const [agentId, setAgentId] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await userAPI.getSlackConfig();
        if (response.data.success) {
          const { config, user } = response.data;
          setSlackBotToken(config?.slackBotToken || "");
          setSlackBotId(config?.slackBotId || "");
          setSlackChannel(config?.slackChannel || "");
          setAgentId(user?.agentId || "");
        }
      } catch (error) {
        console.error("Error fetching slack config:", error);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    // Validate required fields
    if (!slackBotToken.trim()) {
      alert("Please enter your Slack Bot Token");
      return;
    }
    if (!slackBotId.trim()) {
      alert("Please enter your Slack Bot ID");
      return;
    }
    if (!slackChannel.trim()) {
      alert("Please enter your Slack Channel ID");
      return;
    }

    try {
      const response = await userAPI.saveSlackConfig(slackBotToken, slackBotId, slackChannel);
      if (response.data.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Error saving slack config:", error);
      alert("An error occurred while saving the configuration.");
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Slack Configuration</h1>
          <p className="text-muted-foreground">Configure Slack integration to receive escalated chat messages and notifications.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent ID</CardTitle>
            <CardDescription>Your unique agent ID for API integrations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={agentId} readOnly />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slack Integration</CardTitle>
            <CardDescription>
              Connect your Slack workspace to receive escalated chat messages and notifications from your AI agent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slack-bot-token">Slack Bot Token</Label>
              <Input 
                id="slack-bot-token" 
                type="password"
                placeholder="Enter your Slack bot token (xoxb-...)"
                value={slackBotToken}
                onChange={(e) => setSlackBotToken(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slack-bot-id">Slack Bot ID</Label>
              <Input 
                id="slack-bot-id" 
                placeholder="Enter your Slack bot ID (B0123456789)"
                value={slackBotId}
                onChange={(e) => setSlackBotId(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slack-channel">Slack Channel ID</Label>
              <Input 
                id="slack-channel" 
                placeholder="Enter Slack channel ID (C0123456789) or user ID (U0123456789)"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} className="cursor-pointer">
              {isSaved ? (
                <><Check className="w-4 h-4 mr-2" />Saved</>
              ) : (
                "Save"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to set up your Slack integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">1. Create a Slack App</h4>
                <p className="text-sm text-muted-foreground">
                  Go to <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a> and create a new app for your workspace.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">2. Get Bot Token</h4>
                <p className="text-sm text-muted-foreground">
                  In your app settings, go to "OAuth & Permissions" and copy the "Bot User OAuth Token" (starts with xoxb-).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">3. Get Bot ID</h4>
                <p className="text-sm text-muted-foreground">
                  In your app settings, go to "Basic Information" and copy the "App ID" (starts with B).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">4. Get Channel/User ID</h4>
                <p className="text-sm text-muted-foreground">
                  Right-click on the channel or user where you want to receive messages, then select "Copy link" and extract the ID from the URL.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">5. Add Bot Permissions</h4>
                <p className="text-sm text-muted-foreground">
                  In "OAuth & Permissions", add these scopes: <code className="bg-gray-100 px-1 rounded">chat:write</code>, <code className="bg-gray-100 px-1 rounded">channels:read</code>, <code className="bg-gray-100 px-1 rounded">users:read</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
