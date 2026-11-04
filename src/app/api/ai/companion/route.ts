import { NextRequest, NextResponse } from 'next/server'
import type {
  CompanionChatRequest,
  CompanionChatResponse,
} from '@/types/aiCompanion'

export async function POST(req: NextRequest) {
  try {
    const body: CompanionChatRequest = await req.json()
    const { message, persona = 'encouraging', context, conversationHistory: _conversationHistory = [] } = body

    const userMsgLower = (message || '').toLowerCase()

    // 1. Check for external Gemini API Key
    const geminiKey = process.env.GEMINI_API_KEY

    const groundedFacts: string[] = [
      `Current weight: ${context?.currentWeightKg || 74.0} kg`,
      `Target weight: ${context?.targetWeightKg || 70.0} kg`,
      `Readiness score: ${context?.readinessScore || 78}/100`,
      `Dietary preference: ${context?.dietaryPreference || 'Vegetarian'}`,
      `Target calories: ${context?.targetCalories || 2200} kcal (Protein: ${context?.targetProtein || 150}g)`,
    ]

    if (context?.lastWorkoutName) {
      groundedFacts.push(`Last session: ${context.lastWorkoutName} on ${context.lastWorkoutDate || 'recently'}`)
    }

    if (geminiKey) {
      try {
        const personaTone =
          persona === 'disciplined'
            ? 'Direct, focused, athletic coach tone. Emphasize consistency, accountability, and disciplined adherence.'
            : persona === 'scientific'
            ? 'Evidence-based sports scientist and biomechanist tone. Cite physiological mechanisms (protein synthesis, motor unit recruitment, sleep architecture).'
            : 'Warm, encouraging, and supportive companion tone. Emphasize sustainable lifestyle habits, celebrate wins, and reduce fitness anxiety.'

        const prompt = `You are Astra, the personal AI fitness companion inside YashFit.
Your persona style is: ${personaTone}

AUTHENTICATED USER CONTEXT (Strict facts, do not fabricate new user measurements):
- Current Weight: ${context?.currentWeightKg || 74.0} kg
- Target Weight: ${context?.targetWeightKg || 70.0} kg
- Recent Sessions Count: ${context?.recentWorkoutsCount || 4}
- Last Workout: ${context?.lastWorkoutName || 'Push Day'} (${context?.lastWorkoutDate || 'recent'})
- Recovery Readiness: ${context?.readinessScore || 78}/100
- Dietary Preference: ${context?.dietaryPreference || 'Vegetarian'} (Target: ${context?.targetCalories || 2200} kcal, ${context?.targetProtein || 150}g protein)

IMPORTANT GUIDELINES:
1. When recommending foods, prioritize realistic Indian nutrition (Paneer, Dal, Soya Chunks, Curd/Dahi, Eggs, Roti, Daliya, Rajma, Chana, Khichdi).
2. Clearly distinguish your fitness advice from medical diagnoses. Include a brief reminder if health or injury concerns are raised.
3. Be conversational, concise (2 to 4 paragraphs), and actionable.
4. Reference the user's actual stats where relevant.

User message: "${message}"`

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        )

        if (response.ok) {
          const data = await response.json()
          const replyText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            data.candidates?.[0]?.text

          if (replyText) {
            const result: CompanionChatResponse = {
              reply: replyText.trim(),
              personaUsed: persona,
              groundedFacts,
              isAiGenerated: true,
            }
            return NextResponse.json(result)
          }
        }
      } catch {
        // Fallback to deterministic engine
      }
    }

    // 2. Deterministic Rule-Based Fallback Engine
    let reply = ''

    if (
      userMsgLower.includes('workout') ||
      userMsgLower.includes('train') ||
      userMsgLower.includes('exercise') ||
      userMsgLower.includes('routine')
    ) {
      if (persona === 'disciplined') {
        reply = `You logged "${context?.lastWorkoutName || 'Push Day'}" recently with a solid readiness rating of ${context?.readinessScore || 78}/100. Today's mission is executing your next scheduled split with zero compromise on form. Focus on your primary compound lifts—control the eccentric phase and hit your prescribed reps before increasing the load. Let's get it done.`
      } else if (persona === 'scientific') {
        reply = `Based on your recovery score of ${context?.readinessScore || 78}/100, your central nervous system has adequate parasympathetic tone for moderate-to-high intensity resistance stimulus. If your previous session was "${context?.lastWorkoutName || 'Push Day'}", rotate motor unit recruitment to opposing agonists (e.g. Pull or Lower Body) to allow 48 hours for myofibrillar protein synthesis in previously stressed muscle groups.`
      } else {
        reply = `You're doing fantastic! You've logged ${context?.recentWorkoutsCount || 4} great sessions recently. Given your recovery readiness of ${context?.readinessScore || 78}/100, your body is in a prime state to train today. Keep that momentum going—even a focused 30-minute workout will keep your consistency streak alive!`
      }
    } else if (
      userMsgLower.includes('protein') ||
      userMsgLower.includes('food') ||
      userMsgLower.includes('diet') ||
      userMsgLower.includes('eat') ||
      userMsgLower.includes('snack') ||
      userMsgLower.includes('nutrition')
    ) {
      reply = `To hit your target of ${context?.targetProtein || 150}g protein within ${context?.targetCalories || 2200} kcal, here are high-yield Indian staples that fit your ${context?.dietaryPreference || 'Vegetarian'} preferences:\n\n• **Low-Fat Paneer / Chenna (200g):** ~36g protein, slow-digesting casein ideal for satiety.\n• **Nutrela Soya Chunks (50g dry):** ~26g protein at exceptionally high cost efficiency.\n• **Greek Yogurt / Hung Curd (200g):** ~18g protein with gut-friendly probiotics.\n• **Sprouted Green Moong & Roasted Chana:** Quick complex carb and fiber-rich snacks.\n\nSpacing protein evenly across 3–4 meals optimizes muscle protein synthesis throughout the day.`
    } else if (
      userMsgLower.includes('recovery') ||
      userMsgLower.includes('sleep') ||
      userMsgLower.includes('tired') ||
      userMsgLower.includes('sore')
    ) {
      reply = `Your latest recovery score stands at **${context?.readinessScore || 78}/100**. If you are feeling muscular tightness or fatigue, prioritize:\n\n1. **Hydration & Electrolytes:** Aim for 3–3.5 liters of water daily, adding a pinch of pink salt or lemon.\n2. **Sleep Hygiene:** Maintain a consistent 7–8 hour sleep schedule with a dark, cool sleeping environment.\n3. **Active Recovery:** A 20-minute brisk walk or light dynamic mobility session promotes blood flow without adding neuromuscular fatigue.`
    } else if (
      userMsgLower.includes('weight') ||
      userMsgLower.includes('goal') ||
      userMsgLower.includes('progress') ||
      userMsgLower.includes('scale')
    ) {
      reply = `You are currently tracking at **${context?.currentWeightKg || 74.0} kg** with a horizon target of **${context?.targetWeightKg || 70.0} kg**. Remember that scale weight fluctuates daily due to glycogen storage, hydration, and sodium intake. Focus on the 7-day rolling average and circumference changes—your consistent training habits are driving real body recomposition.`
    } else {
      reply = `Hello! I am your YashFit companion. I'm actively monitoring your progress—currently at **${context?.currentWeightKg || 74.0} kg** aiming for **${context?.targetWeightKg || 70.0} kg**, with a strong readiness score of **${context?.readinessScore || 78}/100**.\n\nWhether you need today's workout guidance, high-protein Indian meal ideas, recovery check-ins, or motivation, I'm here to support you every step of the way. What's on your mind today?`
    }

    const fallbackResponse: CompanionChatResponse = {
      reply,
      personaUsed: persona,
      groundedFacts,
      isAiGenerated: false,
    }

    return NextResponse.json(fallbackResponse)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process AI companion message', details: String(error) },
      { status: 500 }
    )
  }
}

