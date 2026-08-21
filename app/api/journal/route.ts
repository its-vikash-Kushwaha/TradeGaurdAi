export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { processJournalEntry } from '@/lib/services/journal.service'
import { getUserId } from '@/lib/auth'
import { checkContentSafety } from '@/lib/ai/azure-content-safety'
import { assertWithinPlan, PlanLimitError } from '@/lib/gating'
import { recomputeTraderModel } from '@/lib/services/traderModel.service'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await db.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: entries })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch journal' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    await assertWithinPlan(userId, 'journal:post')
  } catch (e) {
    if (e instanceof PlanLimitError) {
      return NextResponse.json({ success: false, error: e.message, upgrade: true }, { status: 402 })
    }
    throw e
  }

  try {
    const { rawText, symbol } = await request.json()

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 })
    }

    if (rawText.length > 10_000) {
      return NextResponse.json({ success: false, error: 'Entry too long (max 10,000 characters)' }, { status: 400 })
    }

    // Azure Content Safety — non-blocking, gates riskFlag only
    const safety = await checkContentSafety(rawText)

    const entry = await db.journalEntry.create({
      data: {
        userId,
        rawText,
        symbol: symbol || null,
        processingStatus: 'processing',
        riskFlag: safety.flagged,
      },
    })

    // AI processing — the entry above is already persisted, so ANY failure here
    // (budget exceeded, no provider configured, provider outage, etc.) must
    // degrade gracefully rather than report total failure and discard a
    // successfully-saved entry.
    let degraded = false
    let degradedReason = ''
    try {
      await processJournalEntry(userId, entry.id, rawText, symbol)
    } catch (err) {
      degraded = true
      degradedReason =
        err instanceof Error && err.message === 'AI_BUDGET_EXCEEDED'
          ? 'AI analysis unavailable — daily budget reached. Your entry is saved and will be processed tomorrow.'
          : 'Reflection unavailable — entry saved successfully.'
      console.error('Journal AI processing failed (entry still saved):', err)
      await db.journalEntry.update({
        where: { id: entry.id },
        data: { processingStatus: 'pending' },
      })
    }

    const updatedEntry = await db.journalEntry.findUnique({ where: { id: entry.id } })

    // Fire trader-model recompute asynchronously (non-blocking)
    recomputeTraderModel(userId).catch(() => null)

    return NextResponse.json({
      success: true,
      data: updatedEntry || entry,
      ...(degraded && { degraded: true, degradedReason }),
    })
  } catch (error) {
     console.error('Journal Create Error:', error)
     return NextResponse.json({ success: false, error: 'Failed to save journal' }, { status: 500 })
  }
}
