"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ShoppingCart, 
  Package, 
  CurrencyDollar, 
  Calendar, 
  Building, 
  Check, 
  Warning, 
  Info,
  ArrowRight,
  ArrowLeft,
  Eye,
  PaperPlaneRight
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { logTool, logUI, logAPI, logError } from "@/lib/utils/logger"

interface SAPPurchaseOrderProps {
  result: any
  parameters: any
}

type FormStep = 'form' | 'review' | 'submitting' | 'success' | 'error'

interface FormData {
  vendor: string
  description: string
  amount: string
  currency: string
  department: string
  costCenter: string
  deliveryDate: string
  priority: string
  approver: string
  notes: string
}

interface ValidationErrors {
  [key: string]: string
}

export function SAPPurchaseOrderV2({ result, parameters }: SAPPurchaseOrderProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('form')
  const [formData, setFormData] = useState<FormData>({
    vendor: parameters?.vendor || "",
    description: parameters?.description || "",
    amount: parameters?.amount || "",
    currency: parameters?.currency || "USD",
    department: parameters?.department || "",
    costCenter: parameters?.costCenter || "",
    deliveryDate: parameters?.deliveryDate || "",
    priority: parameters?.priority || "normal",
    approver: parameters?.approver || "",
    notes: parameters?.notes || ""
  })
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    logTool('SAP_PO_COMPONENT_MOUNTED', { parameters, result })
  }, [])

  // Form validation
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    if (!formData.vendor.trim()) errors.vendor = "Vendor is required"
    if (!formData.description.trim()) errors.description = "Description is required"
    if (!formData.amount.trim()) errors.amount = "Amount is required"
    if (!formData.department) errors.department = "Department is required"
    
    if (formData.amount && isNaN(Number(formData.amount))) {
      errors.amount = "Amount must be a valid number"
    }
    
    if (formData.deliveryDate) {
      const date = new Date(formData.deliveryDate)
      const today = new Date()
      if (date < today) {
        errors.deliveryDate = "Delivery date cannot be in the past"
      }
    }

    return errors
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    logUI('FORM_FIELD_CHANGED', { field, value: field === 'amount' ? '***' : value })
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNext = () => {
    logUI('FORM_VALIDATION_STARTED', { step: currentStep })
    
    const errors = validateForm()
    setValidationErrors(errors)
    
    if (Object.keys(errors).length === 0) {
      logUI('FORM_VALIDATION_SUCCESS', { step: 'review' })
      setCurrentStep('review')
    } else {
      logUI('FORM_VALIDATION_FAILED', { errors })
    }
  }

  const handleBack = () => {
    logUI('FORM_STEP_BACK', { from: currentStep, to: 'form' })
    setCurrentStep('form')
  }

  const simulateAPICall = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
    logAPI('SAP_PO_CREATION_STARTED', { formData: { ...formData, amount: '***' } })
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        const success = Math.random() > 0.1 // 90% success rate
        
        if (success) {
          const mockPONumber = `PO-${Date.now()}`
          const response = {
            success: true,
            data: {
              poNumber: mockPONumber,
              status: "Pending Approval",
              createdDate: new Date().toLocaleDateString(),
              totalAmount: formData.amount,
              currency: formData.currency,
              confirmationCode: mockPONumber.toUpperCase(),
              nextSteps: [
                "Purchase order submitted to SAP system",
                "Pending approval from designated approver",
                "Vendor will receive PO once approved",
                `Track status using PO number: ${mockPONumber}`
              ]
            }
          }
          logAPI('SAP_PO_CREATION_SUCCESS', response)
          resolve(response)
        } else {
          const error = { success: false, error: "SAP system temporarily unavailable. Please try again." }
          logAPI('SAP_PO_CREATION_FAILED', error)
          resolve(error)
        }
      }, 2000)
    })
  }

  const handleSubmit = async () => {
    logTool('SAP_PO_SUBMISSION_STARTED', { formData: { ...formData, amount: '***' } })
    
    setCurrentStep('submitting')
    setProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    
    try {
      const result = await simulateAPICall()
      clearInterval(progressInterval)
      setProgress(100)
      
      if (result.success) {
        setCurrentStep('success')
        logTool('SAP_PO_SUBMISSION_SUCCESS', { poNumber: result.data?.poNumber })
      } else {
        setCurrentStep('error')
        logError('tool', 'SAP_PO_SUBMISSION_ERROR', result.error)
      }
    } catch (error) {
      clearInterval(progressInterval)
      setCurrentStep('error')
      logError('tool', 'SAP_PO_SUBMISSION_EXCEPTION', error)
    }
  }

  const handleRetry = () => {
    logUI('SAP_PO_RETRY_CLICKED', {})
    setCurrentStep('review')
    setProgress(0)
  }

  const handleCreateAnother = () => {
    logUI('SAP_PO_CREATE_ANOTHER_CLICKED', {})
    setCurrentStep('form')
    setFormData({
      vendor: "",
      description: "",
      amount: "",
      currency: "USD",
      department: "",
      costCenter: "",
      deliveryDate: "",
      priority: "normal",
      approver: "",
      notes: ""
    })
    setValidationErrors({})
    setProgress(0)
  }

  const departmentOptions = [
    "IT Services", "Finance", "Human Resources", "Operations", 
    "Marketing", "Research & Development", "Facilities", "Legal"
  ]

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-slate-600 dark:text-slate-400" },
    { value: "normal", label: "Normal", color: "text-blue-600 dark:text-blue-400" },
    { value: "high", label: "High", color: "text-orange-600 dark:text-orange-400" },
    { value: "urgent", label: "Urgent", color: "text-red-600 dark:text-red-400" }
  ]

  const currencyOptions = [
    { value: "USD", label: "USD - US Dollar", symbol: "$" },
    { value: "EUR", label: "EUR - Euro", symbol: "€" },
    { value: "MAD", label: "MAD - Moroccan Dirham", symbol: "د.م." },
    { value: "GBP", label: "GBP - British Pound", symbol: "£" }
  ]

  // Form Step Component
  const FormStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-medium">
          1
        </div>
        <h3 className="text-lg font-medium text-foreground">Purchase Order Details</h3>
      </div>

      {/* Vendor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor" className="text-sm font-medium flex items-center gap-2">
            <Building className="w-4 h-4" />
            Vendor/Supplier *
          </Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) => handleInputChange("vendor", e.target.value)}
            placeholder="Enter vendor name or ID"
            className={validationErrors.vendor ? "border-red-500 dark:border-red-400" : ""}
          />
          {validationErrors.vendor && (
            <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.vendor}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="costCenter" className="text-sm font-medium">
            Cost Center
          </Label>
          <Input
            id="costCenter"
            value={formData.costCenter}
            onChange={(e) => handleInputChange("costCenter", e.target.value)}
            placeholder="e.g., CC-001234"
          />
        </div>
      </div>

      {/* Purchase Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
            <Package className="w-4 h-4" />
            Item Description *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Detailed description of items or services to be purchased..."
            className={`min-h-[80px] ${validationErrors.description ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {validationErrors.description && (
            <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium flex items-center gap-2">
              <CurrencyDollar className="w-4 h-4" />
              Amount *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              className={validationErrors.amount ? "border-red-500 dark:border-red-400" : ""}
            />
            {validationErrors.amount && (
              <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium">
              Currency
            </Label>
            <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryDate" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Delivery Date
            </Label>
            <Input
              id="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => handleInputChange("deliveryDate", e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={validationErrors.deliveryDate ? "border-red-500 dark:border-red-400" : ""}
            />
            {validationErrors.deliveryDate && (
              <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.deliveryDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Department and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department" className="text-sm font-medium">
            Requesting Department *
          </Label>
          <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
            <SelectTrigger className={validationErrors.department ? "border-red-500 dark:border-red-400" : ""}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.department && (
            <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.department}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-medium">
            Priority Level
          </Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <span className={priority.color}>{priority.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Approver and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="approver" className="text-sm font-medium">
            Approver
          </Label>
          <Input
            id="approver"
            value={formData.approver}
            onChange={(e) => handleInputChange("approver", e.target.value)}
            placeholder="Manager name or employee ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Any special instructions or notes..."
            className="h-[80px]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} className="min-w-[120px]">
          Review Order
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  // Review Step Component
  const ReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm font-medium">
          2
        </div>
        <h3 className="text-lg font-medium text-foreground">Review & Confirm</h3>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Please review all details carefully before submitting to SAP.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Vendor & Financial</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">{formData.vendor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{currencyOptions.find(c => c.value === formData.currency)?.symbol}{formData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium">{formData.department}</span>
              </div>
              {formData.costCenter && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Center:</span>
                  <span className="font-medium">{formData.costCenter}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Delivery & Priority</h4>
            <div className="space-y-2 text-sm">
              {formData.deliveryDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Date:</span>
                  <span className="font-medium">{new Date(formData.deliveryDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant={formData.priority === 'urgent' ? 'destructive' : formData.priority === 'high' ? 'secondary' : 'outline'}>
                  {formData.priority}
                </Badge>
              </div>
              {formData.approver && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approver:</span>
                  <span className="font-medium">{formData.approver}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium text-foreground mb-2">Description</h4>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {formData.description}
          </p>
        </div>

        {formData.notes && (
          <div>
            <h4 className="font-medium text-foreground mb-2">Additional Notes</h4>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {formData.notes}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Button>
        <Button onClick={handleSubmit} className="min-w-[140px]">
          <PaperPlaneRight className="w-4 h-4 mr-2" />
          Submit to SAP
        </Button>
      </div>
    </div>
  )

  // Submitting Step Component
  const SubmittingStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">Submitting to SAP...</h3>
        <p className="text-sm text-muted-foreground">Creating your purchase order</p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
      </div>
    </div>
  )

  // Success Step Component
  const SuccessStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">Purchase Order Created!</h3>
        <p className="text-sm text-muted-foreground">Your request has been submitted successfully</p>
      </div>

      {result?.data && (
        <div className="bg-muted/50 p-4 rounded-lg text-left max-w-md mx-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Number:</span>
              <span className="font-mono font-medium">{result.data.poNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary">{result.data.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{result.data.createdDate}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleCreateAnother}>
          Create Another
        </Button>
        <Button onClick={() => window.print()}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  )

  // Error Step Component
  const ErrorStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900">
        <Warning className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">Submission Failed</h3>
        <p className="text-sm text-muted-foreground">There was an issue creating your purchase order</p>
      </div>

      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertDescription>
          SAP system temporarily unavailable. Please try again in a few moments.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Form
        </Button>
        <Button onClick={handleRetry}>
          Try Again
        </Button>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-card-foreground">
            <ShoppingCart className="w-6 h-6" />
            SAP Purchase Order
            <Badge variant="outline" className="ml-auto">
              Interactive Form
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 'form' && <FormStep />}
          {currentStep === 'review' && <ReviewStep />}
          {currentStep === 'submitting' && <SubmittingStep />}
          {currentStep === 'success' && <SuccessStep />}
          {currentStep === 'error' && <ErrorStep />}
        </CardContent>
      </Card>
    </div>
  )
}