"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import axios from 'axios';
import { Copy, Check } from 'lucide-react';

const sampleKb = {
    store: {
        name: "Acme Electronics",
        domain: "acme.com",
        supportHours: "9am - 6pm IST",
        returnPolicy: "30 days no-questions return policy",
    },
    products: [
        {
            name: "Quantum Laptop",
            price: 1200,
            specs: {
                cpu: "Quantum Core i9",
                ram: "32GB DDR5",
                storage: "1TB NVMe SSD"
            }
        },
        {
            name: "Photon Smartphone",
            price: 800,
            specs: {
                screen: "6.5 inch OLED",
                camera: "108MP",
                battery: "5000mAh"
            }
        }
    ]
};

export function KnowledgeBase() {
  const [kbContent, setKbContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchKb = async () => {
      try {
        const response = await axios.get("http://localhost:3001/web/kb", { withCredentials: true });
        if (response.data.success && response.data.kb) {
          const content = typeof response.data.kb === 'string' 
            ? response.data.kb 
            : JSON.stringify(response.data.kb, null, 2);
          setKbContent(content);
        }
      } catch (error) {
        console.error("Error fetching knowledge base:", error);
      }
    };
    fetchKb();
  }, []);

  const handleSave = async () => {
    setIsSaving(true)
    try {
      let kbData;
      try {
        kbData = JSON.parse(kbContent);
      } catch (e) {
        alert("Invalid JSON format.");
        setIsSaving(false);
        return;
      }
      await axios.post("http://localhost:3001/web/add-kb", { kb: kbContent }, { withCredentials: true });
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      alert("Failed to save knowledge base. Make sure the JSON is valid.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleKb, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Knowledge Base</h1>
        <p className="text-muted-foreground">Add or update your knowledge base content below. The content must be in JSON format.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Knowledge Base</CardTitle>
              <CardDescription>Enter your JSON content here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder='Enter your knowledge base JSON here...'
                value={kbContent}
                onChange={(e) => setKbContent(e.target.value)}
                className="h-96 font-mono"
              />
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Knowledge Base"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sample</CardTitle>
              <CardDescription>Use this as a template for your knowledge base.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative p-4 bg-muted rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={handleCopy}
                >
                  {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="text-sm whitespace-pre-wrap font-mono">{JSON.stringify(sampleKb, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
