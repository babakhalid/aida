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
  Upload, 
  FileText, 
  Check, 
  Warning, 
  Info,
  ArrowRight,
  ArrowLeft,
  Eye,
  PaperPlaneRight,
  X,
  Download
} from "@phosphor-icons/react"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { logTool, logUI, logAPI, logError } from "@/lib/utils/logger"

interface PurchaseRequestFormProps {
  result: any
  parameters: any
}

type FormStep = 'form' | 'review' | 'submitting' | 'success' | 'error'

interface FormData {
  requestSubject: string
  attachments: File[]
  requesterName: string
  requestType: string
  excelFile: File | null
  referentFamily: string
}

interface ValidationErrors {
  [key: string]: string
}

// Move static data outside component to prevent re-creation
const REFERENT_FAMILIES = [
  "DAG Family",
  "IT Family", 
  "Laboratory Family",
  "Communication and Audiovisual Family",
  "Medicine Family",
  "Sports Family",
  "Books Family",
  "IT Rabat Family",
  "Other"
]

const PurchaseRequestFormComponent = memo(function PurchaseRequestForm({ result, parameters }: PurchaseRequestFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('form')
  const [formData, setFormData] = useState<FormData>({
    requestSubject: parameters?.requestSubject || "",
    attachments: [],
    requesterName: parameters?.requesterName || "Khalid",
    requestType: parameters?.requestType || "",
    excelFile: null,
    referentFamily: parameters?.referentFamily || ""
  })
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [progress, setProgress] = useState(0)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    logTool('PURCHASE_REQUEST_FORM_MOUNTED', { parameters, result })
  }, [])

  // Form validation
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    if (!formData.requestSubject.trim()) errors.requestSubject = "Request subject is required"
    if (!formData.requesterName.trim()) errors.requesterName = "Requester name is required"
    if (!formData.requestType.trim()) errors.requestType = "Request type is required"
    if (!formData.referentFamily) errors.referentFamily = "Referent family is required"
    
    // Check for invalid characters in request subject
    const invalidChars = /[\\/:*?"<>|]/
    if (formData.requestSubject && invalidChars.test(formData.requestSubject)) {
      errors.requestSubject = "Please enter text that does not contain \\ / : * ? \" < > |"
    }

    return errors
  }

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    logUI('FORM_FIELD_CHANGED', { field, hasValue: !!value })
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [validationErrors])

  // Create stable handlers for specific fields
  const handleRequestSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('requestSubject', e.target.value)
  }, [handleInputChange])

  const handleRequesterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('requesterName', e.target.value)
  }, [handleInputChange])

  const handleRequestTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('requestType', e.target.value)
  }, [handleInputChange])

  const handleReferentFamilyChange = useCallback((value: string) => {
    handleInputChange('referentFamily', value)
  }, [handleInputChange])

  const handleFileUpload = (files: FileList | null, type: 'attachments' | 'excel') => {
    if (!files) return

    logUI('FILE_UPLOAD', { type, fileCount: files.length })

    if (type === 'attachments') {
      const newFiles = Array.from(files).slice(0, 10) // Max 10 files
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }))
    } else {
      const file = files[0]
      if (file && file.size <= 100 * 1024 * 1024) { // Max 100MB
        setFormData(prev => ({ ...prev, excelFile: file }))
      } else {
        logError('ui', 'FILE_TOO_LARGE', { size: file?.size, limit: '100MB' })
      }
    }
  }

  const removeAttachment = useCallback((index: number) => {
    logUI('ATTACHMENT_REMOVED', { index })
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }, [])

  const removeExcelFile = useCallback(() => {
    setFormData(prev => ({ ...prev, excelFile: null }))
  }, [])

  const handleRemoveAttachment = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const index = parseInt(e.currentTarget.dataset.index || '0', 10)
    removeAttachment(index)
  }, [removeAttachment])

  const handleAttachmentFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files, 'attachments')
  }, [])

  const handleExcelFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files, 'excel')
  }, [])

  const handleAttachmentClick = useCallback(() => {
    attachmentInputRef.current?.click()
  }, [])

  const handleExcelClick = useCallback(() => {
    excelInputRef.current?.click()
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

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
    logAPI('PURCHASE_REQUEST_SUBMISSION_STARTED', { 
      formData: { 
        ...formData, 
        attachments: formData.attachments.map(f => f.name),
        excelFile: formData.excelFile?.name 
      } 
    })
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1 // 90% success rate
        
        if (success) {
          const mockRequestNumber = `REQ-${Date.now()}`
          const response = {
            success: true,
            data: {
              requestNumber: mockRequestNumber,
              status: "Pending Review",
              submittedDate: new Date().toLocaleDateString(),
              requesterName: formData.requesterName,
              requestSubject: formData.requestSubject,
              confirmationCode: mockRequestNumber.toUpperCase(),
              nextSteps: [
                "Purchase request submitted successfully",
                "Request is pending review by the referent family",
                "You will receive email notifications on status updates",
                `Track your request using ID: ${mockRequestNumber}`
              ]
            }
          }
          logAPI('PURCHASE_REQUEST_SUBMISSION_SUCCESS', response)
          resolve(response)
        } else {
          const error = { success: false, error: "Submission system temporarily unavailable. Please try again." }
          logAPI('PURCHASE_REQUEST_SUBMISSION_FAILED', error)
          resolve(error)
        }
      }, 2000)
    })
  }

  const handleSubmit = async () => {
    logTool('PURCHASE_REQUEST_SUBMISSION_STARTED', { formData: { 
      ...formData, 
      attachments: formData.attachments.map(f => f.name) 
    } })
    
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
        logTool('PURCHASE_REQUEST_SUBMISSION_SUCCESS', { requestNumber: result.data?.requestNumber })
      } else {
        setCurrentStep('error')
        logError('tool', 'PURCHASE_REQUEST_SUBMISSION_ERROR', result.error)
      }
    } catch (error) {
      clearInterval(progressInterval)
      setCurrentStep('error')
      logError('tool', 'PURCHASE_REQUEST_SUBMISSION_EXCEPTION', error)
    }
  }

  const handleRetry = () => {
    logUI('PURCHASE_REQUEST_RETRY_CLICKED', {})
    setCurrentStep('review')
    setProgress(0)
  }

  const handleCreateAnother = () => {
    logUI('PURCHASE_REQUEST_CREATE_ANOTHER_CLICKED', {})
    setCurrentStep('form')
    setFormData({
      requestSubject: "",
      attachments: [],
      requesterName: "Khalid",
      requestType: "",
      excelFile: null,
      referentFamily: ""
    })
    setValidationErrors({})
    setProgress(0)
  }

  // Use the static REFERENT_FAMILIES array defined outside component

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Form Step Component
  const FormStep = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Purchase Request Form</h2>
        <p className="text-sm text-muted-foreground">
          Hello, {formData.requesterName}. When you submit this form, the owner will see your name and email address.
        </p>
        <Badge variant="destructive" className="mt-2 text-xs">Required</Badge>
      </div>

      {/* 1. Request Subject */}
      <div className="space-y-2">
        <Label htmlFor="requestSubject" className="text-sm font-medium">
          1. Request Subject
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Please enter text that does not contain \ / : * ? " &lt; &gt; |
        </p>
        <Input
          id="requestSubject"
          value={formData.requestSubject}
          onChange={handleRequestSubjectChange}
          placeholder="Enter request subject"
          className={validationErrors.requestSubject ? "border-red-500 dark:border-red-400" : ""}
        />
        {validationErrors.requestSubject && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.requestSubject}</p>
        )}
      </div>

      {/* 2. Attachments */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          2. Attachments
        </Label>
        <p className="text-xs text-muted-foreground">(Non-anonymous question)</p>
        
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <Button
              type="button"
              variant="outline"
              onClick={handleAttachmentClick}
            >
              Upload File
            </Button>
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentFileChange}
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            <p>Maximum files: 10</p>
            <p>Maximum file size: 1GB</p>
            <p>Allowed types: Word, Excel, PPT, PDF, Image, Video, Audio</p>
          </div>
        </div>

        {formData.attachments.length > 0 && (
          <div className="space-y-2">
            {formData.attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-mono">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAttachment}
                  data-index={index}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Requester Name */}
      <div className="space-y-2">
        <Label htmlFor="requesterName" className="text-sm font-medium">
          3. Requester Name
        </Label>
        <Input
          id="requesterName"
          value={formData.requesterName}
          onChange={handleRequesterNameChange}
          placeholder="Enter your response"
          className={validationErrors.requesterName ? "border-red-500 dark:border-red-400" : ""}
        />
        {validationErrors.requesterName && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.requesterName}</p>
        )}
      </div>

      {/* 4. Request Type */}
      <div className="space-y-2">
        <Label htmlFor="requestType" className="text-sm font-medium">
          4. Purchase Request Type
        </Label>
        <Input
          id="requestType"
          value={formData.requestType}
          onChange={handleRequestTypeChange}
          placeholder="Enter your response"
          className={validationErrors.requestType ? "border-red-500 dark:border-red-400" : ""}
        />
        {validationErrors.requestType && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.requestType}</p>
        )}
      </div>

      {/* 5. Excel File */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          5. Excel File of Items (Description-Qty-Price ...)
        </Label>
        <p className="text-xs text-muted-foreground">(Non-anonymous question)</p>
        
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Items Template File:</p>
          <a 
            href="https://um6p.sharepoint.com/sites/RPAPARTAGE/Documents%20partages/Articles_Qte.xlsx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download Template
          </a>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-4">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <Button
              type="button"
              variant="outline"
              onClick={handleExcelClick}
            >
              Upload File
            </Button>
            <input
              ref={excelInputRef}
              type="file"
              className="hidden"
              onChange={handleExcelFileChange}
              accept=".xls,.xlsx"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            <p>Maximum files: 1</p>
            <p>Maximum file size: 100MB</p>
            <p>Allowed types: Excel</p>
          </div>
        </div>

        {formData.excelFile && (
          <div className="flex items-center justify-between p-2 bg-muted rounded border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-mono">{formData.excelFile.name}</span>
              <span className="text-xs text-muted-foreground">({formatFileSize(formData.excelFile.size)})</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeExcelFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 6. Referent Family */}
      <div className="space-y-2">
        <Label htmlFor="referentFamily" className="text-sm font-medium">
          6. Referent Family
        </Label>
        <Select 
          value={formData.referentFamily} 
          onValueChange={handleReferentFamilyChange}
        >
          <SelectTrigger className={validationErrors.referentFamily ? "border-red-500 dark:border-red-400" : ""}>
            <SelectValue placeholder="Select referent family" />
          </SelectTrigger>
          <SelectContent>
            {REFERENT_FAMILIES.map((family) => (
              <SelectItem key={family} value={family}>{family}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {validationErrors.referentFamily && (
          <p className="text-sm text-red-500 dark:text-red-400">{validationErrors.referentFamily}</p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} className="min-w-[120px]">
          Review Request
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
          Please review all details carefully before submitting your purchase request.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Request Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">{formData.requestSubject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester:</span>
                <span className="font-medium">{formData.requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{formData.requestType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referent Family:</span>
                <Badge variant="outline">{formData.referentFamily}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Files</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Attachments: </span>
                <span className="font-medium">{formData.attachments.length} file(s)</span>
              </div>
              {formData.excelFile && (
                <div>
                  <span className="text-muted-foreground">Excel File: </span>
                  <span className="font-medium">{formData.excelFile.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Button>
        <Button onClick={handleSubmit} className="min-w-[140px]">
          <PaperPlaneRight className="w-4 h-4 mr-2" />
          Submit Request
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
        <h3 className="text-lg font-medium text-foreground">Submitting Request...</h3>
        <p className="text-sm text-muted-foreground">Processing your purchase request</p>
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
        <h3 className="text-lg font-medium text-foreground">Request Submitted!</h3>
        <p className="text-sm text-muted-foreground">Your purchase request has been submitted successfully</p>
      </div>

      {result?.data && (
        <div className="bg-muted/50 p-4 rounded-lg text-left max-w-md mx-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Request Number:</span>
              <span className="font-mono font-medium">{result.data.requestNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary">{result.data.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted:</span>
              <span>{result.data.submittedDate}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={handleCreateAnother}>
          Create Another
        </Button>
        <Button onClick={handlePrint}>
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
        <p className="text-sm text-muted-foreground">There was an issue submitting your purchase request</p>
      </div>

      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertDescription>
          Submission system temporarily unavailable. Please try again in a few moments.
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
        <CardContent className="p-6">
          {currentStep === 'form' && <FormStep />}
          {currentStep === 'review' && <ReviewStep />}
          {currentStep === 'submitting' && <SubmittingStep />}
          {currentStep === 'success' && <SuccessStep />}
          {currentStep === 'error' && <ErrorStep />}
        </CardContent>
      </Card>
    </div>
  )
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.parameters) === JSON.stringify(nextProps.parameters) &&
         JSON.stringify(prevProps.result) === JSON.stringify(nextProps.result)
})

export { PurchaseRequestFormComponent as PurchaseRequestForm }