import { NextResponse } from 'next/server'
import { queryAiCoach, type CoachUserContext } from '@/lib/ai/providers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { query, context } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query must be a non-empty string.' },
        { status: 400 }
      )
    }

    if (query.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Query exceeds maximum allowed length of 500 characters.' },
        { status: 400 }
      )
    }

    const safeContext: CoachUserContext = {
      profile: context?.profile ?? null,
      workouts: Array.isArray(context?.workouts) ? context.workouts : [],
      recovery: Array.isArray(context?.recovery) ? context.recovery : [],
      waterLoggedLiters: Number(context?.waterLoggedLiters) || 0,
      waterTargetLiters: Number(context?.waterTargetLiters) || 2.5,
      activeStreak: Number(context?.activeStreak) || 0,
      rpgLevel: Number(context?.rpgLevel) || 1,
      rpgRank: typeof context?.rpgRank === 'string' ? context.rpgRank : 'Rookie',
    }

    const response = await queryAiCoach(query.trim(), safeContext)

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    console.error('AI Coach API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process coach query.' },
      { status: 500 }
    )
  }
}
