"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'email' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  defaultValue?: any
}

interface DynamicApprovalFormProps {
  workflowId: string
  stepName: string
  formFields: FormField[]
  onApprove: (formResponse: Record<string, any>, response: string) => Promise<void>
  onReject: (response: string) => Promise<void>
  approverEmail: string
}

export function DynamicApprovalForm({
  workflowId,
  stepName,
  formFields,
  onApprove,
  onReject,
  approverEmail
}: DynamicApprovalFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    formFields.forEach(field => {
      const value = formData[field.id]

      // Required field validation
      if (field.required && (!value || value === '')) {
        newErrors[field.id] = `${field.label} is required`
        return
      }

      // Type-specific validation
      if (value) {
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.id] = 'Invalid email format'
        }

        if (field.type === 'number') {
          const numValue = Number(value)
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            newErrors[field.id] = field.validation.message || `Minimum value is ${field.validation.min}`
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            newErrors[field.id] = field.validation.message || `Maximum value is ${field.validation.max}`
          }
        }

        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            newErrors[field.id] = field.validation.message || 'Invalid format'
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleApprove = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onApprove(formData, response)
    } catch (error) {
      console.error("Approval error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!response.trim()) {
      setErrors({ response: 'Please provide a reason for rejection' })
      return
    }

    setLoading(true)
    try {
      await onReject(response)
    } catch (error) {
      console.error("Rejection error:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || field.defaultValue || ''

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={errors[field.id] ? 'border-red-500' : ''}
            />
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              min={field.validation?.min}
              max={field.validation?.max}
              className={errors[field.id] ? 'border-red-500' : ''}
            />
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={errors[field.id] ? 'border-red-500' : ''}
              rows={4}
            />
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleFieldChange(field.id, val)}
            >
              <SelectTrigger className={errors[field.id] ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === true}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {errors[field.id] && (
              <p className="text-sm text-red-500 ml-2">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.id}-${option}`}
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="cursor-pointer"
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={errors[field.id] ? 'border-red-500' : ''}
            />
            {errors[field.id] && (
              <p className="text-sm text-red-500">{errors[field.id]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{stepName}</CardTitle>
        <CardDescription>
          Workflow ID: {workflowId.slice(0, 16)}... • Approver: {approverEmail}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dynamic Form Fields */}
        {formFields.map(field => renderField(field))}

        {/* General Response/Comments */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="response">
            Additional Comments
          </Label>
          <Textarea
            id="response"
            placeholder="Add any additional comments..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            className={errors.response ? 'border-red-500' : ''}
          />
          {errors.response && (
            <p className="text-sm text-red-500">{errors.response}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </>
          )}
        </Button>
        <Button
          onClick={handleReject}
          disabled={loading}
          variant="destructive"
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
