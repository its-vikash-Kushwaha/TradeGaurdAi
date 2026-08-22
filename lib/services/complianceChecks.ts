// Extracted from app/api/compliance/route.ts so the Multi-Agent Orchestrator
// can reuse the exact same tested check logic instead of duplicating it.
const SYMBOL_FORMAT = /^[A-Z0-9.\-^]{1,15}$/

export interface DocumentSet {
  billOfLading?: { consignee?: string; portOfLoading?: string; portOfDischarge?: string; [k: string]: any }
  letterOfCredit?: { consignee?: string; amount?: number; currency?: string; [k: string]: any }
  invoice?: { amount?: number; currency?: string; [k: string]: any }
}

export interface CheckResult {
  name: string
  passed: boolean
  reason: string
}

export function checkDocumentCompleteness(documents: DocumentSet): CheckResult {
  const missing: string[] = []
  if (!documents.billOfLading) missing.push("billOfLading")
  if (!documents.letterOfCredit) missing.push("letterOfCredit")
  if (!documents.invoice) missing.push("invoice")
  const passed = missing.length === 0
  return {
    name: "document_completeness",
    passed,
    reason: passed ? "All 3 required documents present" : `Missing document(s): ${missing.join(", ")}`
  }
}

export function checkAmountConsistency(documents: DocumentSet): { result: CheckResult; mismatchDetected: boolean } {
  const invoiceAmount = documents.invoice?.amount
  const lcAmount = documents.letterOfCredit?.amount

  if (invoiceAmount == null || lcAmount == null) {
    return {
      result: {
        name: "amount_consistency",
        passed: true,
        reason: "Insufficient data to verify — invoice or LC amount missing, check skipped"
      },
      mismatchDetected: false
    }
  }

  const passed = invoiceAmount === lcAmount
  return {
    result: {
      name: "amount_consistency",
      passed,
      reason: passed
        ? `Invoice amount (${invoiceAmount}) matches LC amount (${lcAmount})`
        : `Mismatch: invoice amount (${invoiceAmount}) does not match LC amount (${lcAmount})`
    },
    mismatchDetected: !passed
  }
}

export function checkPartyVerification(documents: DocumentSet): CheckResult {
  const bolConsignee = documents.billOfLading?.consignee
  const lcConsignee = documents.letterOfCredit?.consignee

  if (!bolConsignee || !lcConsignee) {
    return {
      name: "party_verification",
      passed: true,
      reason: "Insufficient data to verify — consignee missing on one or both documents, check skipped"
    }
  }

  const passed = bolConsignee.trim().toLowerCase() === lcConsignee.trim().toLowerCase()
  return {
    name: "party_verification",
    passed,
    reason: passed
      ? `Consignee "${bolConsignee}" matches across BoL and LC`
      : `Mismatch: BoL consignee "${bolConsignee}" does not match LC consignee "${lcConsignee}"`
  }
}

export function checkRegulatoryCompliance(caseId: string, symbol: string, amountMismatchDetected: boolean): CheckResult {
  const reasons: string[] = []
  if (!caseId) reasons.push("caseId missing")
  if (!symbol || !SYMBOL_FORMAT.test(symbol)) reasons.push("symbol does not match expected ticker format")
  if (amountMismatchDetected) reasons.push("unresolved invoice/LC amount discrepancy is a regulatory red flag under IFSCA cross-border documentation rules")

  const passed = reasons.length === 0
  return {
    name: "regulatory_compliance",
    passed,
    reason: passed ? "No basic IFSCA/RBI rule violations detected" : reasons.join("; ")
  }
}

export function runAllChecks(caseId: string, symbol: string, documents: DocumentSet): CheckResult[] {
  const check1 = checkDocumentCompleteness(documents)
  const { result: check2, mismatchDetected } = checkAmountConsistency(documents)
  const check3 = checkPartyVerification(documents)
  const check4 = checkRegulatoryCompliance(caseId, symbol, mismatchDetected)
  return [check1, check2, check3, check4]
}

export function riskLevelFromChecks(checks: CheckResult[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const failedCount = checks.filter((c) => !c.passed).length
  return failedCount === 0 ? "LOW" : failedCount === 1 ? "MEDIUM" : "HIGH"
}
