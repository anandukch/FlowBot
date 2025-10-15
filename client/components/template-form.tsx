"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Mail, MessageSquare, Monitor } from "lucide-react"

interface NotificationChannel {
  type:  'slack' | 'ui'
  target: string
  enabled: boolean
}

interface ApprovalStep {
  stepNumber: number
  stepName: string
  approverRole: string
  approverEmail?: string
  notificationChannels: NotificationChannel[]
}

interface TemplateFormData {
  templateName: string
  description: string
  steps: ApprovalStep[]
  globalDeadlineHours: number
  allowDelegation: boolean
  allowSkip: boolean
  notifyOnEachStep: boolean
}

const APPROVER_ROLES = [
  'support_team',
  'manager', 
  'director',
  'cfo',
  'admin'
]

const NOTIFICATION_TYPES = [
  { value: 'ui', label: 'Dashboard Only', icon: Monitor, description: 'Show in approval dashboard' },
//   { value: 'email', label: 'Email Notification', icon: Mail, description: 'Send email to approver' },
  { value: 'slack', label: 'Slack Channel', icon: MessageSquare, description: 'Send message to Slack channel' }
]

export function TemplateForm({ onSave, onCancel, initialData }: {
  onSave: (template: TemplateFormData) => void
  onCancel: () => void
  initialData?: any
}) {
  const [formData, setFormData] = useState<TemplateFormData>({
    templateName: '',
    description: '',
    steps: [{
      stepNumber: 1,
      stepName: 'Approval Required',
      approverRole: 'manager',
      notificationChannels: [{
        type: 'ui',
        target: 'dashboard',
        enabled: true
      }]
    }],
    globalDeadlineHours: 24,
    allowDelegation: true,
    allowSkip: false,
    notifyOnEachStep: true
  })

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        templateName: initialData.templateName || '',
        description: initialData.description || '',
        steps: initialData.steps?.map((step: any) => ({
          stepNumber: step.stepNumber,
          stepName: step.stepName,
          approverRole: step.approverRole,
          approverEmail: step.approverEmail || '',
          notificationChannels: step.notificationChannels || [{
            type: 'ui',
            target: 'dashboard',
            enabled: true
          }]
        })) || [{
          stepNumber: 1,
          stepName: 'Approval Required',
          approverRole: 'manager',
          notificationChannels: [{
            type: 'ui',
            target: 'dashboard',
            enabled: true
          }]
        }],
        globalDeadlineHours: initialData.globalDeadlineHours || 24,
        allowDelegation: initialData.allowDelegation ?? true,
        allowSkip: initialData.allowSkip ?? false,
        notifyOnEachStep: initialData.notifyOnEachStep ?? true
      })
    }
  }, [initialData])

  const addStep = () => {
    const newStep: ApprovalStep = {
      stepNumber: formData.steps.length + 1,
      stepName: `Step ${formData.steps.length + 1}`,
      approverRole: 'manager',
      notificationChannels: [{
        type: 'ui',
        target: 'dashboard',
        enabled: true
      }]
    }
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      setFormData(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
          ...step,
          stepNumber: i + 1
        }))
      }))
    }
  }

  const updateStep = (index: number, updates: Partial<ApprovalStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      )
    }))
  }

  const addNotificationChannel = (stepIndex: number) => {
    const newChannel: NotificationChannel = {
      type: 'slack',
      target: '',
      enabled: true
    }
    
    updateStep(stepIndex, {
      notificationChannels: [...formData.steps[stepIndex].notificationChannels, newChannel]
    })
  }

  const updateNotificationChannel = (stepIndex: number, channelIndex: number, updates: Partial<NotificationChannel>) => {
    const step = formData.steps[stepIndex]
    const updatedChannels = step.notificationChannels.map((channel, i) =>
      i === channelIndex ? { ...channel, ...updates } : channel
    )
    
    updateStep(stepIndex, { notificationChannels: updatedChannels })
  }

  const removeNotificationChannel = (stepIndex: number, channelIndex: number) => {
    const step = formData.steps[stepIndex]
    if (step.notificationChannels.length > 1) {
      const updatedChannels = step.notificationChannels.filter((_, i) => i !== channelIndex)
      updateStep(stepIndex, { notificationChannels: updatedChannels })
    }
  }

  const getChannelIcon = (type: string) => {
    const channelType = NOTIFICATION_TYPES.find(t => t.value === type)
    return channelType ? channelType.icon : Monitor
  }

  const getChannelPlaceholder = (type: string) => {
    switch (type) {
      case 'slack':
        return '#approvals or @manager'
      case 'ui':
        return 'dashboard'
      default:
        return ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Basic details about the approval template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={formData.templateName}
              onChange={(e) => setFormData(prev => ({ ...prev, templateName: e.target.value }))}
              placeholder="e.g., Manager Approval"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe when this template should be used..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadline">Deadline (Hours)</Label>
              <Input
                id="deadline"
                type="number"
                value={formData.globalDeadlineHours}
                onChange={(e) => setFormData(prev => ({ ...prev, globalDeadlineHours: parseInt(e.target.value) || 24 }))}
                min="1"
                max="720"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowDelegation"
                  checked={formData.allowDelegation}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowDelegation: checked }))}
                />
                <Label htmlFor="allowDelegation">Allow Delegation</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowSkip"
                  checked={formData.allowSkip}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowSkip: checked }))}
                />
                <Label htmlFor="allowSkip">Allow Skip</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Approval Steps</CardTitle>
              <CardDescription>Configure the approval workflow steps and notification channels</CardDescription>
            </div>
            <Button type="button" onClick={addStep} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.steps.map((step, stepIndex) => (
            <div key={stepIndex} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Step {step.stepNumber}</h4>
                {formData.steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(stepIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Step Name</Label>
                  <Input
                    value={step.stepName}
                    onChange={(e) => updateStep(stepIndex, { stepName: e.target.value })}
                    placeholder="e.g., Manager Review"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label>Approver Role</Label>
                  <Input
                    value={step.approverRole}
                    onChange={(e) => updateStep(stepIndex, { approverRole: e.target.value })}
                    placeholder="e.g., manager, support_team, director"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label>Specific Approver Email (Optional)</Label>
                  <Input
                    value={step.approverEmail || ''}
                    onChange={(e) => updateStep(stepIndex, { approverEmail: e.target.value })}
                    placeholder="Leave empty to use role-based assignment"
                    className="w-full"
                  />
                </div>
              </div>
                      {/* Notification Channels */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Notification Channels</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addNotificationChannel(stepIndex)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Channel
                  </Button>
                </div>

                {step.notificationChannels.map((channel, channelIndex) => {
                  return (
                    <div key={channelIndex} className="p-3 bg-muted rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Select
                          value={channel.type}
                          onValueChange={(value: 'slack' | 'ui') => 
                            updateNotificationChannel(stepIndex, channelIndex, { 
                              type: value,
                              target: value === 'ui' ? 'dashboard' : ''
                            })
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTIFICATION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-4 h-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(checked) => updateNotificationChannel(stepIndex, channelIndex, { enabled: checked })}
                          />
                          <span className="text-xs text-muted-foreground min-w-[24px]">
                            {channel.enabled ? 'On' : 'Off'}
                          </span>
                        </div>

                        {step.notificationChannels.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotificationChannel(stepIndex, channelIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="w-full">
                        <Input
                          value={channel.target}
                          onChange={(e) => updateNotificationChannel(stepIndex, channelIndex, { target: e.target.value })}
                          placeholder={getChannelPlaceholder(channel.type)}
                          disabled={channel.type === 'ui'}
                          className={`w-full ${
                            channel.type === 'ui' 
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' 
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Template
        </Button>
      </div>
    </form>
  )
}
