export interface PurchaseOrderData {
  // UM6P specific fields
  subject?: string
  requestor?: string
  projectManager?: string
  purchaseType?: string
  designation?: string
  entity?: string
  budgetLine?: string
  familyReferent?: string
  
  // Standard fields
  vendor?: string
  description?: string
  amount?: string
  currency?: string
  department?: string
  costCenter?: string
  deliveryDate?: string
  priority?: string
  approver?: string
  notes?: string
}

export async function createPurchaseOrder(data: PurchaseOrderData) {
  // Always show the interactive form for SAP purchase order creation
  // Check if we have all required data for completion
  const isComplete = data.vendor && data.description && data.amount && data.department
  
  if (isComplete) {
    // Complete purchase order creation
    const mockPONumber = `PO-${Date.now()}`
    
    // Simulate SAP API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      success: true,
      poNumber: mockPONumber,
      vendor: data.vendor,
      description: data.description,
      amount: data.amount,
      currency: data.currency || "USD",
      department: data.department,
      costCenter: data.costCenter,
      deliveryDate: data.deliveryDate,
      priority: data.priority || "normal",
      approver: data.approver,
      notes: data.notes,
      status: "Pending Approval",
      createdDate: new Date().toLocaleDateString(),
      totalAmount: data.amount,
      message: `🎉 Successfully created purchase order ${mockPONumber} in SAP`,
      confirmationCode: mockPONumber.toUpperCase(),
      ui: "sap-purchase-order",
      nextSteps: [
        "Purchase order has been submitted to SAP system",
        "Pending approval from designated approver",
        "Vendor will receive PO once approved",
        "Track status in SAP using PO number: " + mockPONumber
      ]
    }
  } else {
    // Return partial data to show UM6P interactive form
    return {
      success: false,
      partial: true,
      
      // UM6P required fields
      subject: data.subject || "",
      requestor: data.requestor || "",
      projectManager: data.projectManager || "",
      purchaseType: data.purchaseType || "",
      designation: data.designation || "",
      entity: data.entity || "",
      budgetLine: data.budgetLine || "",
      familyReferent: data.familyReferent || "",
      
      // Standard fields
      vendor: data.vendor || "",
      description: data.description || "",
      amount: data.amount || "",
      currency: data.currency || "MAD",
      deliveryDate: data.deliveryDate || "",
      approver: data.approver || "",
      notes: data.notes || "",
      
      message: "📋 Je vais vous guider à travers le processus de Demande d'Achat UM6P. Utilisez le formulaire interactif ci-dessous pour saisir toutes les informations requises.",
      ui: "sap-purchase-order",
      showForm: true,
      
      guidanceSteps: [
        "1. Saisissez l'objet de votre demande (vous recevrez un N°DA avec cet objet)",
        "2. Indiquez votre nom complet comme demandeur",
        "3. Sélectionnez le type d'achat approprié selon le montant et la nature",
        "4. Remplissez la désignation du produit en français",
        "5. Choisissez votre entité (ex: U129 pour Communication)",
        "6. Indiquez la ligne budgétaire avec le type d'achat",
        "7. Sélectionnez la famille référent selon la nature de la prestation"
      ],
      
      processInfo: {
        replaces: "Ce processus digitalisé remplace les demandes par e-mail",
        validation: "Transmission automatique au référent métier pour vérification",
        automation: "Le robot créera automatiquement la DA après validation",
        tracking: "Vous recevrez un e-mail avec la référence DA",
        reminders: "Relances automatiques tous les 3 jours pour accélérer l'approbation"
      }
    }
  }
}

// Helper function to validate UM6P purchase type requirements
export function validatePurchaseTypeRequirements(purchaseType: string, amount: string): {
  isValid: boolean
  messages: string[]
  requiredDocuments: string[]
} {
  const numAmount = parseFloat(amount) || 0
  const messages: string[] = []
  let requiredDocuments: string[] = []
  
  switch (purchaseType) {
    case 'direct':
      if (numAmount > 50000) {
        messages.push('⚠️ Montant > 50 KMAD: Appel d\'offres requis au lieu d\'achat direct')
      }
      requiredDocuments = [
        'Descriptif technique détaillé (sans lien fournisseur ni prix)',
        'Proposition fournisseur'
      ]
      break
      
    case 'tender':
      if (numAmount <= 50000) {
        messages.push('ℹ️ Montant ≤ 50 KMAD: Achat direct possible')
      }
      requiredDocuments = [
        'Descriptif technique détaillé',
        'Synthèse des critères de sélection',
        'Propositions fournisseurs'
      ]
      break
      
    case 'direct_contract':
      requiredDocuments = [
        'Devis',
        'Note gré à gré signée par le responsable d\'entité',
        'Lettre d\'exclusivité (si applicable)'
      ]
      break
      
    case 'online':
      requiredDocuments = [
        'Lien d\'achat',
        'Capture d\'écran de l\'achat'
      ]
      break
      
    case 'contract':
      requiredDocuments = [
        'Contrat',
        'Factures à payer'
      ]
      break
      
    case 'vacation':
      requiredDocuments = [
        'Contrat de vacataire'
      ]
      break
  }
  
  return {
    isValid: messages.length === 0 || !messages.some(m => m.includes('⚠️')),
    messages,
    requiredDocuments
  }
}