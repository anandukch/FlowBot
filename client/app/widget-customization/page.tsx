"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Eye, Save, RotateCcw } from 'lucide-react';

interface WidgetConfig {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  
  // Appearance
  borderRadius: number;
  shadowIntensity: number;
  width: number;
  height: number;
  
  // Positioning
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Branding
  agentName: string;
  welcomeMessage: string;
  avatarUrl: string;
  
  // Features
  showAvatar: boolean;
  showTypingIndicator: boolean;
  enableSounds: boolean;
  
  // Advanced
  fontFamily: string;
  fontSize: number;
  animationSpeed: string;
}

const defaultConfig: WidgetConfig = {
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  backgroundColor: '#ffffff',
  textColor: '#37352f',
  headerColor: '#ffffff',
  borderRadius: 10,
  shadowIntensity: 15,
  width: 600,
  height: 700,
  position: 'bottom-right',
  agentName: 'Lyzr Assistant',
  welcomeMessage: 'Hey I am Lyzr Assistant 👋 How can I help you today?',
  avatarUrl: '',
  showAvatar: true,
  showTypingIndicator: true,
  enableSounds: false,
  fontFamily: 'system-ui',
  fontSize: 14,
  animationSpeed: 'normal'
};

export default function WidgetCustomizationPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load existing configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await userAPI.getWidgetConfig();
        if (response.data.success && response.data.config) {
          setConfig({ ...defaultConfig, ...response.data.config });
        }
      } catch (error) {
        console.error('Error loading widget config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
    setIsSaved(false);
  };

  const saveConfiguration = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.saveWidgetConfig(config);
      if (response.data.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreviewCSS = () => {
    return `/* Chat Widget Custom Styles */
.chat-container {
  width: ${config.width}px !important;
  height: ${config.height}px !important;
  background: ${config.backgroundColor} !important;
  border-radius: ${config.borderRadius}px !important;
  box-shadow: 0 8px ${config.shadowIntensity}px rgba(0, 0, 0, 0.15) !important;
  font-family: ${config.fontFamily} !important;
  font-size: ${config.fontSize}px !important;
  position: fixed;
  ${config.position.includes('bottom') ? 'bottom' : 'top'}: 20px;
  ${config.position.includes('right') ? 'right' : 'left'}: 20px;
}

.chat-container .header {
  background: ${config.headerColor} !important;
  color: ${config.textColor} !important;
}

.chat-container .header h1 {
  color: ${config.textColor} !important;
}

.chat-icon {
  background: ${config.primaryColor} !important;
  ${config.position.includes('bottom') ? 'bottom' : 'top'}: 20px;
  ${config.position.includes('right') ? 'right' : 'left'}: 20px;
}

.message.user {
  background: ${config.primaryColor} !important;
  color: ${config.secondaryColor} !important;
}

.message.assistant {
  background: ${config.secondaryColor} !important;
  color: ${config.textColor} !important;
  border: 1px solid #e9e9e7 !important;
}

.input-container button {
  background: ${config.primaryColor} !important;
  color: ${config.secondaryColor} !important;
}

.input-container button:hover {
  background: ${config.primaryColor}dd !important;
}

/* Agent Name Customization */
.chat-container .header h1::after {
  content: "${config.agentName}";
}

/* Animation Speed */
.chat-container {
  transition: all ${config.animationSpeed === 'fast' ? '0.2s' : config.animationSpeed === 'slow' ? '0.6s' : config.animationSpeed === 'none' ? '0s' : '0.3s'} cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Avatar Visibility */
${!config.showAvatar ? '.avatar { display: none !important; }' : ''}

/* Typing Indicator */
${!config.showTypingIndicator ? '.typing-indicator { display: none !important; }' : ''}`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Widget Customization</h1>
              <p className="text-muted-foreground mt-2">
                Customize the appearance and behavior of your chat widget
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button
                variant="outline"
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                onClick={saveConfiguration}
                className="flex items-center gap-2"
                disabled={isSaved}
              >
                <Save className="w-4 h-4" />
                {isSaved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Layout & Sizing</CardTitle>
                      <CardDescription>Adjust the widget dimensions and positioning</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Width (px)</Label>
                          <Input
                            type="number"
                            value={config.width}
                            onChange={(e) => updateConfig('width', parseInt(e.target.value))}
                            min={300}
                            max={800}
                          />
                        </div>
                        <div>
                          <Label>Height (px)</Label>
                          <Input
                            type="number"
                            value={config.height}
                            onChange={(e) => updateConfig('height', parseInt(e.target.value))}
                            min={400}
                            max={900}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Border Radius: {config.borderRadius}px</Label>
                        <Slider
                          value={[config.borderRadius]}
                          onValueChange={([value]) => updateConfig('borderRadius', value)}
                          max={30}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Shadow Intensity: {config.shadowIntensity}px</Label>
                        <Slider
                          value={[config.shadowIntensity]}
                          onValueChange={([value]) => updateConfig('shadowIntensity', value)}
                          max={30}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Position</Label>
                        <Select value={config.position} onValueChange={(value) => updateConfig('position', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        Color Scheme
                      </CardTitle>
                      <CardDescription>Customize the widget colors to match your brand</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.primaryColor}
                              onChange={(e) => updateConfig('primaryColor', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={config.primaryColor}
                              onChange={(e) => updateConfig('primaryColor', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Secondary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.secondaryColor}
                              onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={config.secondaryColor}
                              onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.backgroundColor}
                              onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={config.backgroundColor}
                              onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.textColor}
                              onChange={(e) => updateConfig('textColor', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={config.textColor}
                              onChange={(e) => updateConfig('textColor', e.target.value)}
                              placeholder="#37352f"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Header Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.headerColor}
                              onChange={(e) => updateConfig('headerColor', e.target.value)}
                              className="w-16 h-10"
                            />
                            <Input
                              value={config.headerColor}
                              onChange={(e) => updateConfig('headerColor', e.target.value)}
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="branding" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Branding & Messages</CardTitle>
                      <CardDescription>Customize the agent branding and messages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Agent Name</Label>
                        <Input
                          value={config.agentName}
                          onChange={(e) => updateConfig('agentName', e.target.value)}
                          placeholder="Clara"
                        />
                      </div>

                      <div>
                        <Label>Welcome Message</Label>
                        <Input
                          value={config.welcomeMessage}
                          onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                          placeholder="Hey I am Clara 👋 How can I help you today?"
                        />
                      </div>

                      <div>
                        <Label>Avatar URL (optional)</Label>
                        <Input
                          value={config.avatarUrl}
                          onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.showAvatar}
                          onCheckedChange={(checked) => updateConfig('showAvatar', checked)}
                        />
                        <Label>Show Avatar</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.showTypingIndicator}
                          onCheckedChange={(checked) => updateConfig('showTypingIndicator', checked)}
                        />
                        <Label>Show Typing Indicator</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.enableSounds}
                          onCheckedChange={(checked) => updateConfig('enableSounds', checked)}
                        />
                        <Label>Enable Sounds</Label>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>Fine-tune typography and animations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Font Family</Label>
                        <Select value={config.fontFamily} onValueChange={(value) => updateConfig('fontFamily', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system-ui">System UI</SelectItem>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Font Size: {config.fontSize}px</Label>
                        <Slider
                          value={[config.fontSize]}
                          onValueChange={([value]) => updateConfig('fontSize', value)}
                          min={12}
                          max={18}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Animation Speed</Label>
                        <Select value={config.animationSpeed} onValueChange={(value) => updateConfig('animationSpeed', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                            <SelectItem value="none">No Animation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>See how your widget will look on your website</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-100 rounded-lg p-4 min-h-[400px] overflow-hidden">
                    {/* Mock Website Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
                    <div className="relative z-10 text-center py-20">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Website</h3>
                      <p className="text-gray-500">The chat widget will appear here</p>
                    </div>

                    {/* Widget Preview */}
                    {previewMode && (
                      <div
                        className="absolute"
                        style={{
                          [config.position.includes('bottom') ? 'bottom' : 'top']: '20px',
                          [config.position.includes('right') ? 'right' : 'left']: '20px',
                          width: `${Math.min(config.width * 0.4, 240)}px`,
                          height: `${Math.min(config.height * 0.4, 280)}px`,
                          background: config.backgroundColor,
                          borderRadius: `${config.borderRadius}px`,
                          boxShadow: `0 4px ${config.shadowIntensity}px rgba(0, 0, 0, 0.15)`,
                          border: '1px solid #e3e3e3',
                          fontSize: `${config.fontSize * 0.8}px`,
                          fontFamily: config.fontFamily,
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            background: config.headerColor,
                            color: config.textColor,
                            padding: '8px 12px',
                            borderBottom: '1px solid #e9e9e7',
                            borderRadius: `${config.borderRadius}px ${config.borderRadius}px 0 0`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {config.showAvatar && (
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: config.primaryColor,
                                }}
                              ></div>
                            )}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '500' }}>
                                {config.agentName}
                              </div>
                              <div style={{ fontSize: '9px', color: '#65b665' }}>● Online</div>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div style={{ padding: '12px', height: 'calc(100% - 80px)', overflow: 'hidden' }}>
                          <div
                            style={{
                              background: config.secondaryColor,
                              color: config.textColor,
                              padding: '6px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              border: '1px solid #e9e9e7',
                              marginBottom: '8px',
                            }}
                          >
                            {config.welcomeMessage}
                          </div>
                          <div
                            style={{
                              background: config.primaryColor,
                              color: config.secondaryColor,
                              padding: '6px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              marginLeft: '20px',
                              marginBottom: '8px',
                            }}
                          >
                            Hello! I need help with...
                          </div>
                          {config.showTypingIndicator && (
                            <div style={{ fontSize: '9px', color: '#999', fontStyle: 'italic' }}>
                              {config.agentName} is typing...
                            </div>
                          )}
                        </div>

                        {/* Input */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '4px',
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              background: '#f5f5f5',
                              borderRadius: '16px',
                              padding: '4px 8px',
                              fontSize: '9px',
                              border: '1px solid #e9e9e7',
                            }}
                          >
                            Type a message...
                          </div>
                          <div
                            style={{
                              background: config.primaryColor,
                              color: config.secondaryColor,
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                          >
                            →
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>How to Test Your Widget</CardTitle>
                  <CardDescription>Your customizations are automatically applied to the widget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">✅ Auto-Applied</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Your widget customizations are automatically saved and applied. 
                        Visit your test page to see the changes in real-time!
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {/* <p><strong>Test URL:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">http://localhost:3001/mock-ui/</code></p> */}
                      <p><strong>Your Agent ID:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{user?.agentId || 'Loading...'}</code></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CSS Output */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated CSS</CardTitle>
                  <CardDescription>Custom styles that will be applied to your widget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {isLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        <span className="ml-2 text-muted-foreground">Loading configuration...</span>
                      </div>
                    ) : (
                      <>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-60 text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap border">
                          {generatePreviewCSS()}
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(generatePreviewCSS());
                            alert('CSS copied to clipboard!');
                          }}
                        >
                          Copy CSS
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
