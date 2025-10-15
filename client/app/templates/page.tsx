"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { approvalAPI } from "@/lib/api"
import { CheckCircle, Clock, Users, Loader2, Plus, Trash2, Edit, MoreVertical, Star } from "lucide-react"

export default function TemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  
  // Form state
  const [templateName, setTemplateName] = useState("")
  const [description, setDescription] = useState("")
  const [deadlineHours, setDeadlineHours] = useState("24")
  const [steps, setSteps] = useState([
    { stepName: "Approval Required", approverRole: "support_team", approverEmail: "" }
  ])

  useEffect(() => {
    if (user?.agentId) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await approvalAPI.getTemplates(user?.agentId || '')
      if (response.data.success) {
        setTemplates(response.data.templates)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultTemplates = async () => {
    try {
      setCreating(true)
      await approvalAPI.createDefaultTemplates(user?.agentId || '')
      await fetchTemplates()
    } catch (error) {
      console.error("Error creating templates:", error)
    } finally {
      setCreating(false)
    }
  }

  const addStep = () => {
    setSteps([...steps, { stepName: "", approverRole: "", approverEmail: "" }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const handleCreateTemplate = async () => {
    try {
      setCreating(true)
      const templateId = editingTemplate ? 
        editingTemplate.templateId : 
        `${user?.agentId}_${templateName.toLowerCase().replace(/\s+/g, '_')}`
      
      if (editingTemplate) {
        // Update existing template
        await approvalAPI.createTemplate({
          templateId,
          templateName,
          description,
          agentId: user?.agentId,
          steps: steps.map((step, index) => ({
            stepNumber: index + 1,
            stepName: step.stepName,
            approverRole: step.approverRole,
            approverEmail: step.approverEmail || undefined,
            status: 'pending',
            formFields: [
              {
                id: 'response',
                type: 'textarea',
                label: 'Response',
                required: false
              }
            ]
          })),
          globalDeadlineHours: parseInt(deadlineHours),
          allowDelegation: true,
          allowSkip: false,
          notifyOnEachStep: true,
          isActive: true
        })
      } else {
        // Create new template
        await approvalAPI.createTemplate({
          templateId,
          templateName,
          description,
          agentId: user?.agentId,
          steps: steps.map((step, index) => ({
            stepNumber: index + 1,
            stepName: step.stepName,
            approverRole: step.approverRole,
            approverEmail: step.approverEmail || undefined,
            status: 'pending',
            formFields: [
              {
                id: 'response',
                type: 'textarea',
                label: 'Response',
                required: false
              }
            ]
          })),
          globalDeadlineHours: parseInt(deadlineHours),
          allowDelegation: true,
          allowSkip: false,
          notifyOnEachStep: true,
          isActive: true
        })
      }
      
      // Reset form
      setTemplateName("")
      setDescription("")
      setDeadlineHours("24")
      setSteps([{ stepName: "Approval Required", approverRole: "support_team", approverEmail: "" }])
      setEditingTemplate(null)
      setShowDialog(false)
      
      await fetchTemplates()
    } catch (error) {
      console.error("Error saving template:", error)
      alert("Failed to save template. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setTemplateName(template.templateName)
    setDescription(template.description)
    setDeadlineHours(template.globalDeadlineHours?.toString() || "24")
    setSteps(template.steps?.map((step: any) => ({
      stepName: step.stepName,
      approverRole: step.approverRole,
      approverEmail: step.approverEmail || ""
    })) || [{ stepName: "Approval Required", approverRole: "support_team", approverEmail: "" }])
    setShowDialog(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeleting(templateId)
      const { approvalAPI } = await import('@/lib/api')
      const response = await approvalAPI.deleteTemplate(templateId)
      
      if (response.data.success) {
        console.log('✅ Template deleted successfully')
        await fetchTemplates() // Refresh the list
      } else {
        throw new Error(response.data.message || 'Delete failed')
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("Failed to delete template. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (templateId: string) => {
    try {
      setSettingDefault(templateId)
      const { approvalAPI } = await import('@/lib/api')
      const response = await approvalAPI.setDefaultTemplate(templateId)
      
      if (response.data.success) {
        console.log('✅ Template set as default successfully')
        await fetchTemplates() // Refresh the list to show updated default status
      } else {
        throw new Error(response.data.message || 'Set default failed')
      }
    } catch (error) {
      console.error("Error setting default template:", error)
      alert("Failed to set default template. Please try again.")
    } finally {
      setSettingDefault(null)
    }
  }

  const resetForm = () => {
    setTemplateName("")
    setDescription("")
    setDeadlineHours("24")
    setSteps([{ stepName: "Approval Required", approverRole: "support_team", approverEmail: "" }])
    setEditingTemplate(null)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Approval Templates</h1>
              <p className="text-muted-foreground">
                Manage approval workflow templates
              </p>
            </div>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button onClick={createDefaultTemplates} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Default Templates'
                  )}
                </Button>
              )}
              {templates.length > 0 && (
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Template
                </Button>
              )}
            </div>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create default templates to get started with approval workflows
                </p>
                <Button onClick={createDefaultTemplates} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Default Templates'
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.templateId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.templateName}</CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                        {template.isDefault && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          {!template.isDefault && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetDefault(template.templateId)}
                              disabled={settingDefault === template.templateId}
                              className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800"
                              title="Set as default template for widget escalations"
                            >
                              {settingDefault === template.templateId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.templateId)}
                            disabled={deleting === template.templateId}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            {deleting === template.templateId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{template.steps?.length || 0} steps</span>
                      </div>
                      {template.globalDeadlineHours && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{template.globalDeadlineHours}h deadline</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Approval Steps:</p>
                      <div className="space-y-1">
                        {template.steps?.map((step: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-3 h-3" />
                            <span>{step.stepName}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.approverRole}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Delegation:</span>
                        <span>{template.allowDelegation ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Skip steps:</span>
                        <span>{template.allowSkip ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Notifications:</span>
                        <span>{template.notifyOnEachStep ? 'Each step' : 'Final only'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {templates.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">💡 Template Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Templates are automatically used when creating workflows via API
                </p>
                <p>
                  • Default template: <code className="px-1 py-0.5 bg-background rounded">
                    {user?.agentId}_simple_approval
                  </code>
                </p>
                <p>
                  • If no template is found, a basic single-step approval is used
                </p>
              </CardContent>
            </Card>
          )}

          {/* Custom Template Creation Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Create Custom Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate ? 
                    'Update your approval workflow template' : 
                    'Build a custom approval workflow template with multiple steps'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., IT Request Approval"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe when this template should be used..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deadline">Deadline (hours)</Label>
                    <Input
                      id="deadline"
                      type="number"
                      value={deadlineHours}
                      onChange={(e) => setDeadlineHours(e.target.value)}
                      placeholder="24"
                      min="1"
                      max="720"
                    />
                  </div>
                </div>

                {/* Approval Steps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Approval Steps</Label>
                    <Button onClick={addStep} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Step
                    </Button>
                  </div>

                  {steps.map((step, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">Step {index + 1}</h4>
                        {steps.length > 1 && (
                          <Button
                            onClick={() => removeStep(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Step Name</Label>
                          <Input
                            value={step.stepName}
                            onChange={(e) => updateStep(index, 'stepName', e.target.value)}
                            placeholder="e.g., Manager Review"
                          />
                        </div>

                        <div>
                          <Label>Approver Role</Label>
                          <Input
                            value={step.approverRole}
                            onChange={(e) => updateStep(index, 'approverRole', e.target.value)}
                            placeholder="e.g., manager, director"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label>Approver Email (optional)</Label>
                          <Input
                            value={step.approverEmail}
                            onChange={(e) => updateStep(index, 'approverEmail', e.target.value)}
                            placeholder="e.g., manager@company.com"
                            type="email"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  resetForm()
                  setShowDialog(false)
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTemplate} 
                  disabled={creating || !templateName || !description || steps.some(s => !s.stepName || !s.approverRole)}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingTemplate ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTemplate ? 'Update Template' : 'Create Template'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
