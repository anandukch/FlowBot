"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Copy, Check } from "lucide-react"
import axios from "axios"

export default function IntegrationsPage() {
  

  
  // const agentId = "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  // const scriptTag = `<script src="http://localhost:3001/widget.js" data-agent-id="${agentId}" async></script>`
  const [isCopied, setIsCopied] = useState(false)

  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/web/slack-config`, { withCredentials: true });
        if (response.data.success && response.data.user) {
          const { config, agentId } = response.data.user;
          // setSlackBotToken(config?.slackBotToken || "");
          // setSlackBotId(config?.slackBotId || "");
          // setSlackChannel(config?.slackChannel || "");
          setAgentId(agentId || "");
        }
      } catch (error) {
        console.error("Error fetching slack config:", error);
      }
    };
    fetchConfig();
  }, []);

  const handleCopy = () => {
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        })
      } else {
        // Fallback for browsers that don't support navigator.clipboard
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err)
        }
        document.body.removeChild(textArea)
      }
    }
    copyToClipboard(`<script src="${process.env.NEXT_PUBLIC_API_URL}/widget.js" data-agent-id="${agentId}" async></script>`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">Embed the chat widget on your website.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Embeddable Script</CardTitle>
            <CardDescription>Copy and paste this script into your website's HTML to add the chat widget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground overflow-x-auto">
              <pre><code>{`<script src="${process.env.NEXT_PUBLIC_API_URL}/widget.js" data-agent-id="${agentId}" async></script>`}</code></pre>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCopy}>
              {isCopied ? (
                <><Check className="w-4 h-4 mr-2" />Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" />Copy Script</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
