import { NextResponse } from 'next/server'
import type { TodayWorkoutRecommendation } from '@/types/autopilot'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const recommendation: TodayWorkoutRecommendation = body.recommendation

    if (!recommendation || !recommendation.routineName) {
      return NextResponse.json(
        { error: 'Missing or invalid recommendation object' },
        { status: 400 }
      )
    }

    const geminiKey = process.env.GEMINI_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    // Rule-based fallback summary
    const ruleBasedExplanation = `${recommendation.overallRationale} Focus on maintaining strict kinematic alignment, bracing your core on all compound lifts, and stopping short of technical breakdown.`

    if (geminiKey) {
      try {
        const prompt = `You are the YashFit AI Training Specialist.
Explain this adaptive workout recommendation to the athlete concisely in 2-3 sentences.
Routine: ${recommendation.routineName}
Readiness Category: ${recommendation.readinessCategory}
Rationale: ${recommendation.overallRationale}
Adaptations: ${recommendation.exerciseAdaptations.map((a) => `${a.exerciseName}: ${a.actionType} (${a.reason})`).join(', ')}

Rules:
1. Explain the physiological benefit.
2. Be encouraging, precise, and professional.
3. Do not invent any unrecorded data.`

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        )

        if (res.ok) {
          const json = await res.json()
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (text) {
            return NextResponse.json({
              explanation: text,
              providerUsed: 'gemini',
            })
          }
        }
      } catch (err) {
        console.warn('Gemini explanation fallback to rule-based:', err)
      }
    }

    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are the YashFit AI Training Specialist. Be concise, scientific, and encouraging.',
              },
              {
                role: 'user',
                content: `Explain this recommendation: Routine: ${recommendation.routineName}, Readiness: ${recommendation.readinessCategory}, Rationale: ${recommendation.overallRationale}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 150,
          }),
        })

        if (res.ok) {
          const json = await res.json()
          const text = json?.choices?.[0]?.message?.content?.trim()
          if (text) {
            return NextResponse.json({
              explanation: text,
              providerUsed: 'openai',
            })
          }
        }
      } catch (err) {
        console.warn('OpenAI explanation fallback to rule-based:', err)
      }
    }

    // Deterministic fallback
    return NextResponse.json({
      explanation: ruleBasedExplanation,
      providerUsed: 'rule_based',
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error processing autopilot explanation' },
      { status: 500 }
    )
  }
}
