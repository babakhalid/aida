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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Package, CurrencyDollar, Calendar, Building, Check, Warning, Info, Upload, FileText, Calculator } from "@phosphor-icons/react"
import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { logTool, logUI, logAPI, logError } from "@/lib/utils/logger"

interface SAPPurchaseOrderProps {
  result: any
  parameters: any
}

// Move static data outside component to prevent re-creation
const PURCHASE_TYPES = [
  {
    value: "direct",
    label: "Achat direct",
    description: "Montant ≤ 50 KMAD",
    requirements: ["Descriptif technique détaillé (sans lien fournisseur ni prix)", "Proposition fournisseur"]
  },
  {
    value: "tender", 
    label: "Appel d'Offres",
    description: "Montant > 50 KMAD",
    requirements: ["Descriptif technique détaillé", "Synthèse des critères de sélection", "Propositions fournisseurs"]
  },
  {
    value: "direct_contract",
    label: "Achat en gré à gré", 
    description: "Fournisseur précis (Exclusivité/Confidentialité/Urgence)",
    requirements: ["Devis", "Note gré à gré signée par le responsable d'entité", "Lettre d'exclusivité (si applicable)"]
  },
  {
    value: "online",
    label: "Achat en ligne",
    description: "Service en ligne",
    requirements: ["Lien d'achat", "Capture d'écran de l'achat"]
  },
  {
    value: "contract",
    label: "Convention ou Accord-Cadre",
    description: "Contrat existant", 
    requirements: ["Contrat", "Factures à payer"]
  },
  {
    value: "vacation",
    label: "Achat de vacation",
    description: "Prestation de vacataire",
    requirements: ["Contrat de vacataire"]
  }
]

const ENTITIES = [
  { code: "U129", name: "Communication" },
  { code: "U101", name: "Finance" },
  { code: "U102", name: "RH" },
  { code: "U103", name: "IT" },
  { code: "U104", name: "Recherche" },
  { code: "U105", name: "Operations" }
]

const FAMILY_REFERENTS = [
  "Informatique et Télécommunications",
  "Équipements de Laboratoire",
  "Fournitures de Bureau",
  "Services de Maintenance",
  "Formation et Consulting",
  "Équipements Industriels",
  "Services Généraux"
]

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
]

const SAPPurchaseOrderComponent = memo(function SAPPurchaseOrder({ result, parameters }: SAPPurchaseOrderProps) {
  const [formData, setFormData] = useState({
    // Basic info
    subject: parameters?.subject || "",
    requestor: parameters?.requestor || "",
    projectManager: parameters?.projectManager || "",
    
    // Purchase type and details
    purchaseType: parameters?.purchaseType || "",
    vendor: parameters?.vendor || "",
    description: parameters?.description || "",
    amount: parameters?.amount || "",
    currency: parameters?.currency || "MAD",
    
    // UM6P specific fields
    designation: parameters?.designation || "",
    entity: parameters?.entity || "",
    budgetLine: parameters?.budgetLine || "",
    familyReferent: parameters?.familyReferent || "",
    
    // Delivery and approval
    deliveryDate: parameters?.deliveryDate || "",
    priority: parameters?.priority || "normal",
    approver: parameters?.approver || "",
    notes: parameters?.notes || "",
    
    // Attachments tracking
    attachments: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
  }

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Create stable handlers for specific fields to prevent re-renders
  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('subject', e.target.value)
  }, [handleInputChange])

  const handleRequestorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('requestor', e.target.value)
  }, [handleInputChange])

  const handleProjectManagerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('projectManager', e.target.value)
  }, [handleInputChange])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange('description', e.target.value)
  }, [handleInputChange])

  const handleDesignationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('designation', e.target.value)
  }, [handleInputChange])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('amount', e.target.value)
  }, [handleInputChange])

  const handleVendorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('vendor', e.target.value)
  }, [handleInputChange])

  const handleBudgetLineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('budgetLine', e.target.value)
  }, [handleInputChange])

  const handleDeliveryDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('deliveryDate', e.target.value)
  }, [handleInputChange])

  const handleApproverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange('approver', e.target.value)
  }, [handleInputChange])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange('notes', e.target.value)
  }, [handleInputChange])

  // Select handlers
  const handlePurchaseTypeChange = useCallback((value: string) => {
    handleInputChange('purchaseType', value)
  }, [handleInputChange])

  const handleCurrencyChange = useCallback((value: string) => {
    handleInputChange('currency', value)
  }, [handleInputChange])

  const handleEntityChange = useCallback((value: string) => {
    handleInputChange('entity', value)
  }, [handleInputChange])

  const handleFamilyReferentChange = useCallback((value: string) => {
    handleInputChange('familyReferent', value)
  }, [handleInputChange])

  const handleBackToEdit = useCallback(() => {
    setIsReviewing(false)
  }, [])

  const handlePurchaseTypeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const value = e.currentTarget.dataset.value
    if (value) {
      handlePurchaseTypeChange(value)
    }
  }, [handlePurchaseTypeChange])

  const handleReview = useCallback(() => {
    setIsReviewing(true)
    
    // Validate form data according to UM6P rules
    const errors: string[] = []
    const warnings: string[] = []
    
    // Required fields validation
    if (!formData.subject) errors.push("L'objet de la demande est obligatoire")
    if (!formData.requestor) errors.push("Le nom du demandeur est obligatoire")
    if (!formData.purchaseType) errors.push("Le type d'achat doit être sélectionné")
    if (!formData.designation) errors.push("La désignation du produit en français est obligatoire")
    if (!formData.entity) errors.push("L'entité doit être sélectionnée")
    if (!formData.budgetLine) errors.push("La ligne budgétaire est obligatoire")
    if (!formData.familyReferent) errors.push("La famille référent doit être sélectionnée")
    if (!formData.amount) errors.push("Le montant estimé est obligatoire")
    
    // Amount and purchase type validation
    const amount = parseFloat(formData.amount) || 0
    if (amount > 0) {
      if (formData.purchaseType === "direct" && amount > 50000) {
        errors.push("Achat direct non autorisé pour des montants > 50 KMAD. Sélectionnez 'Appel d'Offres'")
      }
      if (formData.purchaseType === "tender" && amount <= 50000) {
        warnings.push("Montant ≤ 50 KMAD: L'achat direct pourrait être plus approprié")
      }
    }
    
    // Entity code validation
    if (formData.entity && !formData.entity.match(/^U\d{3}$/)) {
      errors.push("Le code entité doit suivre le format U### (ex: U129)")
    }
    
    // Budget line validation
    if (formData.budgetLine && formData.purchaseType && !formData.budgetLine.includes(formData.purchaseType)) {
      warnings.push("La ligne budgétaire devrait inclure le type d'achat sélectionné")
    }
    
    setValidationErrors(errors)
    setValidationWarnings(warnings)
    
    // If no errors, proceed to review
    if (errors.length === 0) {
      // Show review modal or section
    }
  }, [formData])

  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true)
    // Here you'll call your API
    console.log('Final submission to API:', formData)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsReviewing(false)
  }, [formData])

  const selectedPurchaseType = useMemo(() => 
    PURCHASE_TYPES.find(type => type.value === formData.purchaseType), 
    [formData.purchaseType]
  )
  
  const estimatedAmount = useMemo(() => parseFloat(formData.amount) || 0, [formData.amount])
  const isDirectPurchase = useMemo(() => estimatedAmount <= 50000, [estimatedAmount])
  
  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50" key="sap-purchase-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <ShoppingCart className="size-6" />
            Demande d'Achat UM6P - SAP
            <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
              Processus Digitalisé
            </Badge>
          </CardTitle>
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ce formulaire remplace l'envoi des demandes par e-mail. Toute demande d'achat doit être soumise exclusivement via ce processus digitalisé.
            </AlertDescription>
          </Alert>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <Warning className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erreurs à corriger:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <Warning className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Recommandations:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {validationWarnings.map((warning, idx) => (
                    <li key={idx} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Tabs defaultValue="basic" className="w-full" key="sap-purchase-tabs">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Informations de base</TabsTrigger>
              <TabsTrigger value="purchase">Type d'achat</TabsTrigger>
              <TabsTrigger value="details">Détails UM6P</TabsTrigger>
              <TabsTrigger value="attachments">Pièces jointes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {/* Objet et Demandeur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-blue-700 font-medium flex items-center gap-2">
                    <FileText className="size-4" />
                    Objet de la demande *
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={handleSubjectChange}
                    placeholder="Indiquez l'objet de votre demande"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-600">Le robot vous enverra un N°DA avec cet objet</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requestor" className="text-blue-700 font-medium">
                    Nom du demandeur *
                  </Label>
                  <Input
                    id="requestor"
                    value={formData.requestor}
                    onChange={handleRequestorChange}
                    placeholder="Votre nom complet"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectManager" className="text-blue-700 font-medium">
                  Chef de projet concerné
                </Label>
                <Input
                  id="projectManager"
                  value={formData.projectManager}
                  onChange={handleProjectManagerChange}
                  placeholder="Nom du chef de projet (si applicable)"
                  className="bg-white border-blue-300 focus:border-blue-500"
                />
                <p className="text-sm text-gray-600">Chaque entité gérant plusieurs projets, vous pouvez indiquer le chef de projet concerné</p>
              </div>
            </TabsContent>
            
            <TabsContent value="purchase" className="space-y-6">
              {/* Type d'achat */}
              <div className="space-y-4">
                <Label className="text-blue-700 font-medium text-lg">Type de demande d'achat *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PURCHASE_TYPES.map((type) => (
                    <Card 
                      key={type.value}
                      className={`cursor-pointer transition-all ${
                        formData.purchaseType === type.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={handlePurchaseTypeClick}
                      data-value={type.value}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-blue-800">{type.label}</h4>
                          {formData.purchaseType === type.value && <Check className="size-5 text-blue-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Documents requis:</p>
                          {type.requirements.map((req, idx) => (
                            <p key={idx} className="text-xs text-gray-600">• {req}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedPurchaseType && (
                  <Alert>
                    <Warning className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Documents requis pour {selectedPurchaseType.label}:</strong>
                      <ul className="mt-2 space-y-1">
                        {selectedPurchaseType.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm">• {req}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Montant estimé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-blue-700 font-medium flex items-center gap-2">
                    <Calculator className="size-4" />
                    Montant estimé *
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="bg-white border-blue-300 focus:border-blue-500"
                    />
                    <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                      <SelectTrigger className="w-24 bg-white border-blue-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {estimatedAmount > 0 && (
                    <p className={`text-sm ${
                      isDirectPurchase ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {isDirectPurchase 
                        ? '✓ Éligible pour achat direct (≤ 50 KMAD)' 
                        : '⚠ Nécessite un appel d\'offres (> 50 KMAD)'
                      }
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vendor" className="text-blue-700 font-medium flex items-center gap-2">
                    <Building className="size-4" />
                    Fournisseur proposé
                  </Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={handleVendorChange}
                    placeholder="Nom du fournisseur (si connu)"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-6">
              {/* Désignation et Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="designation" className="text-blue-700 font-medium flex items-center gap-2">
                    <Package className="size-4" />
                    Désignation (nom du produit en français) *
                  </Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={handleDesignationChange}
                    placeholder="Nom exact du produit ou service"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-blue-700 font-medium">
                    Description détaillée *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Description technique détaillée des articles ou services à acheter..."
                    className="bg-white border-blue-300 focus:border-blue-500 min-h-[100px]"
                  />
                </div>
              </div>
              
              {/* Entité et Ligne budgétaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity" className="text-blue-700 font-medium">
                    Entité *
                  </Label>
                  <Select value={formData.entity} onValueChange={handleEntityChange}>
                    <SelectTrigger className="bg-white border-blue-300">
                      <SelectValue placeholder="Sélectionner votre entité" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map((entity) => (
                        <SelectItem key={entity.code} value={entity.code}>
                          {entity.code} - {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">Exemple: communication = U129</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budgetLine" className="text-blue-700 font-medium">
                    Ligne budgétaire (ordre interne) *
                  </Label>
                  <Input
                    id="budgetLine"
                    value={formData.budgetLine}
                    onChange={handleBudgetLineChange}
                    placeholder="Code de la ligne budgétaire + type d'achat"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-600">Assurez-vous que la ligne est correcte et alimentée</p>
                </div>
              </div>
              
              {/* Famille Référent */}
              <div className="space-y-2">
                <Label htmlFor="familyReferent" className="text-blue-700 font-medium">
                  Famille Référent *
                </Label>
                <Select value={formData.familyReferent} onValueChange={handleFamilyReferentChange}>
                  <SelectTrigger className="bg-white border-blue-300">
                    <SelectValue placeholder="Choisir la famille appropriée" />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILY_REFERENTS.map((family) => (
                      <SelectItem key={family} value={family}>{family}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">Sélectionner selon la nature de la prestation</p>
              </div>
              
              {/* Date de livraison et notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate" className="text-blue-700 font-medium flex items-center gap-2">
                    <Calendar className="size-4" />
                    Date de livraison souhaitée
                  </Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={handleDeliveryDateChange}
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="approver" className="text-blue-700 font-medium">
                    Approbateur
                  </Label>
                  <Input
                    id="approver"
                    value={formData.approver}
                    onChange={handleApproverChange}
                    placeholder="Nom du responsable approbateur"
                    className="bg-white border-blue-300 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-blue-700 font-medium">
                  Notes additionnelles
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="Instructions spéciales ou informations complémentaires..."
                  className="bg-white border-blue-300 focus:border-blue-500 h-[80px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="attachments" className="space-y-6">
              {/* Zone de téléchargement des pièces jointes */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-blue-700 font-medium flex items-center gap-2">
                    <Upload className="size-4" />
                    Pièces jointes requises
                  </Label>
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
                    <Upload className="size-8 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-700 font-medium mb-2">Glissez-déposez vos fichiers ici</p>
                    <p className="text-sm text-gray-600 mb-4">ou cliquez pour sélectionner</p>
                    <Button variant="outline" className="border-blue-300 text-blue-700">
                      Choisir les fichiers
                    </Button>
                  </div>
                </div>
                
                {selectedPurchaseType && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Documents requis pour {selectedPurchaseType.label}:</strong>
                      <ul className="mt-2 space-y-1">
                        {selectedPurchaseType.requirements.map((req, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Excel file completion guide */}
                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Fichier Excel à compléter:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• <strong>Désignation:</strong> le nom de votre produit en français</li>
                      <li>• <strong>Entité:</strong> numéro de l'entité (ex: communication = U129)</li>
                      <li>• <strong>Ligne budgétaire:</strong> ordre interne + type d'achat</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
              
              {/* Process guidance */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <Info className="size-4" />
                    Guide du processus UM6P
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-blue-700 mb-1">Étapes de validation:</h5>
                      <ol className="text-xs text-blue-600 space-y-1 ml-4">
                        <li>1. Vérification par le référent métier</li>
                        <li>2. Validation manuelle des éléments</li>
                        <li>3. Création automatique de la DA par le robot</li>
                        <li>4. Envoi d'un e-mail avec la référence DA</li>
                        <li>5. Relances automatiques tous les 3 jours</li>
                      </ol>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        <strong>Important:</strong> Ce formulaire interactif remplace les demandes par e-mail et assure un traitement plus rapide de votre demande.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="pt-4 border-t border-blue-200">
            <Alert className="mb-4">
              <Warning className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Assurez-vous que toutes les informations saisies sont correctes, car toute erreur entraînera un rejet et nécessitera de recommencer le processus.
              </AlertDescription>
            </Alert>
            
            {!isReviewing ? (
              <Button
                onClick={handleReview}
                disabled={!formData.subject || !formData.requestor || !formData.purchaseType || !formData.designation || !formData.entity || !formData.budgetLine || !formData.familyReferent}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
              >
                <Check className="size-5 mr-3" />
                Vérifier et Valider la Demande
              </Button>
            ) : (
              <div className="space-y-3">
                {validationErrors.length === 0 && (
                  <>
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Validation réussie!</strong> Votre demande est conforme aux règles UM6P.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleBackToEdit}
                        variant="outline"
                        className="flex-1"
                      >
                        Modifier
                      </Button>
                      <Button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Soumission...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="size-4 mr-2" />
                            Confirmer la Soumission
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
                
                {validationErrors.length > 0 && (
                  <Button
                    onClick={handleBackToEdit}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    Corriger les Erreurs
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Result Display */}
          {result && result.success && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Check className="size-5 text-green-700" />
                <span className="font-medium text-green-800">Demande d'Achat soumise avec succès!</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">N° DA:</span>
                  <div className="font-mono text-green-900 text-lg">{result.daNumber}</div>
                </div>
                <div>
                  <span className="font-medium text-green-700">Statut:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">{result.status}</Badge>
                </div>
                <div>
                  <span className="font-medium text-green-700">Montant total:</span>
                  <div className="font-mono text-green-900">{result.currency} {result.totalAmount}</div>
                </div>
                <div>
                  <span className="font-medium text-green-700">Date de création:</span>
                  <div className="text-green-900">{result.createdDate}</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/50 rounded">
                <div className="font-medium text-green-700 mb-2">Processus de validation:</div>
                <div className="text-sm text-green-800 space-y-1">
                  <p>1. Votre demande est transmise au référent métier pour vérification</p>
                  <p>2. Vérification manuelle de tous les éléments</p>
                  <p>3. Transmission au robot pour création de la DA</p>
                  <p>4. Vous recevrez un e-mail avec la référence de la demande</p>
                  <p>5. Notifications de relance tous les 3 jours pour accélérer l'approbation</p>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Suivi:</strong> Vous recevrez automatiquement des mises à jour par e-mail sur le statut de votre DA. Le robot consulte régulièrement le statut et vous envoie des captures d'écran.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.parameters) === JSON.stringify(nextProps.parameters) &&
         JSON.stringify(prevProps.result) === JSON.stringify(nextProps.result)
})

export { SAPPurchaseOrderComponent as SAPPurchaseOrder }