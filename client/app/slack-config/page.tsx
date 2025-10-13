"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Check } from "lucide-react"

export default function IntegrationsPage() {
  const [slackBotToken, setSlackBotToken] = useState("")
  const [slackBotId, setSlackBotId] = useState("")
  const [slackChannel, setSlackChannel] = useState("")
  const [agentId, setAgentId] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/web/slack-config`, { withCredentials: true });
        if (response.data.success && response.data.user) {
          const { config, agentId } = response.data.user;
          setSlackBotToken(config?.slackBotToken || "");
          setSlackBotId(config?.slackBotId || "");
          setSlackChannel(config?.slackChannel || "");
          setAgentId(agentId || "");
        }
      } catch (error) {
        console.error("Error fetching slack config:", error);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/web/slack-config`,
        { slackBotToken, slackBotId, slackChannel },
        { withCredentials: true }
      );
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
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your tools and services.</p>
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
            <CardDescription>Connect your Slack workspace to receive notifications and interact with your agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <div className="space-y-2">
              <Label htmlFor="slack-bot-token">Slack Bot Token</Label>
              <Input 
                id="slack-bot-token" 
                type="password"
                placeholder="Enter your Slack bot token"
                value={slackBotToken}
                onChange={(e) => setSlackBotToken(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slack-bot-id">Slack Bot ID</Label>
              <Input 
                id="slack-bot-id" 
                placeholder="Enter your Slack bot ID"
                value={slackBotId}
                onChange={(e) => setSlackBotId(e.target.value)}
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="slack-channel">Slack User ID (The user id of the Customer support agent)</Label>
              <Input 
                id="slack-channel" 
                placeholder="Enter your Slack user id (e.g., U0123456789)"
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
      </div>
    </DashboardLayout>
  )
}
