import { NextRequest, NextResponse } from 'next/server'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import { queryAiCoach } from '@/lib/ai/providers'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, userId = 'demo-user' } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query message is required.' }, { status: 400 })
    }

    // 1. Gather verified fitness context
    const context = await buildCoachContext(userId)

    // 2. Query Coach (Cloud LLM or Deterministic Rule Engine)
    const coachResponse = await queryAiCoach(query, context)

    // 3. Multi-turn Persistence in Supabase if authenticated
    try {
      const supabase = await createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        // Record user query
        await supabase.from('coach_conversations').insert({
          user_id: authData.user.id,
          role: 'user',
          content: query,
        })
        // Record coach reply
        await supabase.from('coach_conversations').insert({
          user_id: authData.user.id,
          role: 'assistant',
          content: coachResponse.recommendation,
          response_metadata: coachResponse as any,
        })
      }
    } catch {
      // In demo/offline mode, client handles localStorage persistence
    }

    return NextResponse.json({
      success: true,
      response: coachResponse,
    })
  } catch (err: any) {
    console.error('Coach API Error:', err)
    return NextResponse.json(
      { error: 'Failed to process coach query.', details: err?.message },
      { status: 500 }
    )
  }
}
