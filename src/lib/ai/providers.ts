import type { StructuredCoachResponse } from '@/types/commandCenter'
import type { UserProfile } from '@/types/profile'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'
import { INDIAN_FOOD_DATABASE } from '@/data/indianFoods'

export interface CoachUserContext {
  profile: UserProfile | null
  workouts: TwinWorkout[]
  recovery: RecoveryEntry[]
  waterLoggedLiters: number
  waterTargetLiters: number
  activeStreak: number
  rpgLevel: number
  rpgRank: string
}

/**
 * Deterministic, transparent rule-based AI Coach reasoning engine.
 * Used whenever external cloud LLM providers are unconfigured or fail.
 */
export function generateDeterministicCoachResponse(
  query: string,
  context: CoachUserContext
): StructuredCoachResponse {
  const q = query.toLowerCase()
  const { profile, workouts, recovery, waterLoggedLiters, waterTargetLiters } = context

  const latestRecovery = recovery[0] || null
  const readiness = latestRecovery?.readinessScore ?? 75
  const sleepHours = latestRecovery?.sleepHours ?? 7
  const soreness = (latestRecovery?.soreness || 'Low').toLowerCase()
  const primaryGoal = profile?.primary_goal || 'General Fitness'
  const dietPref = profile?.dietary_preference || 'Vegetarian'

  // 1. Performance / Changes in Workout Performance
  if (q.includes('performance') || q.includes('progress') || q.includes('plateau') || q.includes('strength')) {
    const totalVolume = workouts.slice(0, 3).reduce((sum, w) => sum + (Number(w.totalVolume) || 0), 0)
    const prevVolume = workouts.slice(3, 6).reduce((sum, w) => sum + (Number(w.totalVolume) || 0), 0)

    let trendDescription = 'stable'
    if (workouts.length >= 6) {
      if (totalVolume > prevVolume * 1.05) trendDescription = 'increasing (+5%+ volume over recent sessions)'
      else if (totalVolume < prevVolume * 0.95) trendDescription = 'decreased (-5% volume drop detected)'
    }

    return {
      recommendation: readiness < 55
        ? 'Prioritize nervous system recovery before testing peak strength.'
        : 'Consolidate working sets with 1-2 extra repetitions rather than immediately jumping weight.',
      supportingData: `Recorded ${workouts.length} total sessions. Recent volume trend is ${trendDescription}. Latest readiness score is ${readiness}/100 with ${sleepHours}h sleep.`,
      explanation: readiness < 55
        ? 'Strength performance is heavily dictated by systemic fatigue and sleep debt. High soreness and readiness below 55 compromise motor unit recruitment.'
        : 'Steady progressive overload yields consistent strength adaptations while minimizing connective tissue strain.',
      nextAction: 'Review your Exercise Strength Progression in the charts below and keep rest intervals between compound lifts to at least 2 minutes.',
      actionHref: '/progress',
      limitations: 'Calculated using recorded workout logs and readiness check-ins. External factors like work stress or hydration timing are not factored.',
      provider: 'rule_based',
    }
  }

  // 2. Next Workout Recommendation
  if (q.includes('next workout') || q.includes('today') || q.includes('what should i do') || q.includes('train')) {
    if (soreness === 'severe' || readiness < 50 || sleepHours < 5.5) {
      return {
        recommendation: 'Take an Active Recovery Day or focus exclusively on light mobility & walking.',
        supportingData: `Readiness check-in is ${readiness}/100, sleep is ${sleepHours} hours, and muscle soreness is marked as "${soreness}".`,
        explanation: 'Elevated fatigue markers combined with sleep under 6 hours significantly increase injury risk and blunt hypertrophic protein synthesis.',
        nextAction: 'Log 20-30 minutes of light walking, maintain hydration at 3.0L, and target 8+ hours of sleep tonight.',
        actionHref: '/recovery',
        limitations: 'Recommendation relies on your self-reported recovery check-in. If you feel unexpectedly energetic, you may do light technique drills.',
        provider: 'rule_based',
      }
    }

    const scheduledSplit = profile?.training_days_per_week && profile.training_days_per_week <= 3 ? 'Full Body' : 'Push / Upper Split'
    return {
      recommendation: `Proceed with your scheduled ${scheduledSplit} session with standard working load.`,
      supportingData: `Readiness is ${readiness}/100 (Optimal/Good), muscle soreness is "${soreness}", and ${workouts.length} sessions logged this month.`,
      explanation: 'Your recovery indicators show sufficient readiness for planned volume and intensity.',
      nextAction: 'Launch your active workout session from the Command Center action plan.',
      actionHref: '/workout',
      limitations: 'Assumes no undisclosed acute joint discomfort. Warm up thoroughly with 2 progressive warm-up sets.',
      provider: 'rule_based',
    }
  }

  // 3. Indian Meal / Nutrition Suggestions
  if (q.includes('meal') || q.includes('food') || q.includes('diet') || q.includes('protein') || q.includes('calorie') || q.includes('eat')) {
    const budgetFoods = INDIAN_FOOD_DATABASE.filter((f) => {
      if (dietPref === 'Vegetarian') return f.dietaryPreference === 'Vegetarian'
      if (dietPref === 'Vegan') return f.dietaryPreference === 'Vegan' || (f.dietaryPreference === 'Vegetarian' && !f.name.toLowerCase().includes('paneer') && !f.name.toLowerCase().includes('curd'))
      if (dietPref === 'Eggetarian') return f.dietaryPreference === 'Vegetarian' || f.dietaryPreference === 'Eggetarian'
      return true
    }).slice(0, 4)

    const foodList = budgetFoods.map((f) => `${f.name} (${f.proteinGrams}g protein, ₹${f.costPerServingInr || '20'})`).join(', ')

    return {
      recommendation: `Incorporate high-protein, budget-friendly Indian staples: ${foodList}.`,
      supportingData: `User dietary preference is "${dietPref}" with goal "${primaryGoal}".`,
      explanation: 'Hitting protein targets (1.6g-2.0g per kg body weight) is the primary nutritional lever for lean mass preservation and recovery.',
      nextAction: 'Add these items to your YashFit Grocery Planner to generate an organized shopping list.',
      actionHref: '/grocery',
      limitations: 'Calorie and macronutrient estimates are based on standardized Indian Food Composition tables; home preparation oil and ghee usage will alter values.',
      provider: 'rule_based',
    }
  }

  // 4. Inconsistencies / Tracking Habits
  if (q.includes('inconsistency') || q.includes('habit') || q.includes('water') || q.includes('sleep') || q.includes('check-in')) {
    const waterShortage = Math.max(0, waterTargetLiters - waterLoggedLiters)
    return {
      recommendation: waterShortage > 1.0
        ? `Increase fluid intake by ${waterShortage.toFixed(1)}L today to hit your hydration target.`
        : 'Maintain daily recovery check-ins every morning before 10 AM.',
      supportingData: `Water logged: ${waterLoggedLiters.toFixed(1)}L / ${waterTargetLiters.toFixed(1)}L. Recovery check-ins available: ${recovery.length}.`,
      explanation: 'Mild hypohydration (even 2% body mass loss) impairs muscular power output by up to 10% and elevates perceived exertion.',
      nextAction: 'Log your current water intake using the Quick Hydration tracker.',
      actionHref: '/nutrition',
      limitations: 'Hydration requirement fluctuates based on ambient temperature and sweat rate during workouts.',
      provider: 'rule_based',
    }
  }

  // 5. Exercise Substitutions
  if (q.includes('substitute') || q.includes('replace') || q.includes('alternate') || q.includes('knee') || q.includes('shoulder')) {
    return {
      recommendation: 'Swap heavy axial-loading compound lifts with dumbbell or cable equivalents when experiencing joint sensitivity.',
      supportingData: 'Available equipment and exercise database contains verified biomechanical alternatives.',
      explanation: 'Substitutions maintain equivalent mechanical tension on target muscle fibers while accommodating equipment availability or temporary joint discomfort.',
      nextAction: 'Review exercise alternatives inside the Digital Twin scenario editor or Workout Planner.',
      actionHref: '/digital-twin',
      limitations: 'Substitutions do not replace professional medical evaluation for sharp or persistent joint pain.',
      provider: 'rule_based',
    }
  }

  // Default General Summary
  return {
    recommendation: `Stay consistent with your ${primaryGoal} plan and aim for balanced progression across all pillars.`,
    supportingData: `Profile goal: ${primaryGoal}. Completed workouts: ${workouts.length}. Active streak: ${context.activeStreak} days. Rank: ${context.rpgRank}.`,
    explanation: 'Long-term training adherence and progressive stimulus account for over 80% of physiological body recomposition results.',
    nextAction: 'Complete the top priority task in your Personal Action Plan today.',
    actionHref: '/command-center',
    limitations: 'This guidance is synthesized deterministically from your logged YashFit records and does not constitute medical advice.',
    provider: 'rule_based',
  }
}

/**
 * Server-side AI Provider Dispatcher.
 * Uses Gemini or OpenAI if configured via environment variables, otherwise falls back seamlessly to deterministic rules.
 */
export async function queryAiCoach(
  query: string,
  context: CoachUserContext
): Promise<StructuredCoachResponse> {
  const provider = (process.env.AI_PROVIDER || 'rule_based').toLowerCase()
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // If Gemini is explicitly configured and key exists
  if (provider === 'gemini' && geminiKey) {
    try {
      const systemInstruction = `You are the YashFit AI Fitness Coach. Provide an evidence-based, concise fitness recommendation based ONLY on the user's provided context.
You MUST output strictly valid JSON matching this schema:
{
  "recommendation": "Short direct recommendation (1-2 sentences)",
  "supportingData": "The verified user context data or measurement supporting this",
  "explanation": "Clear physiological explanation of why",
  "nextAction": "Practical immediate action the user should take",
  "actionHref": "/workout or /nutrition or /recovery or /digital-twin",
  "limitations": "Important limitations or assumptions"
}
Do not hallucinate measurements. Do not promise guaranteed fat loss or muscle gain. Suggest affordable Indian food options when relevant.`

      const prompt = `User Context:
- Primary Goal: ${context.profile?.primary_goal || 'General Fitness'}
- Experience: ${context.profile?.experience_level || 'Intermediate'}
- Diet Preference: ${context.profile?.dietary_preference || 'Vegetarian'}
- Available Equipment: ${(context.profile?.available_equipment || ['Gym Equipment']).join(', ')}
- Workouts Logged: ${context.workouts.length}
- Recent Readiness: ${context.recovery[0]?.readinessScore ?? 'N/A'}/100
- Recent Sleep: ${context.recovery[0]?.sleepHours ?? 'N/A'} hours
- Recent Soreness: ${context.recovery[0]?.soreness ?? 'N/A'}
- Today's Water: ${context.waterLoggedLiters}L / ${context.waterTargetLiters}L
- Active Streak: ${context.activeStreak} days

User Question: "${query}"`

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          const parsed = JSON.parse(text)
          return {
            recommendation: parsed.recommendation || 'Stay consistent with your training schedule.',
            supportingData: parsed.supportingData || 'Based on your logged YashFit profile.',
            explanation: parsed.explanation || 'Regular progressive overload drives adaptations.',
            nextAction: parsed.nextAction || 'Continue your planned session.',
            actionHref: parsed.actionHref || '/command-center',
            limitations: parsed.limitations || 'AI model projection. Not medical advice.',
            provider: 'gemini',
          }
        }
      }
    } catch (err) {
      console.warn('Gemini AI Provider failed, falling back to deterministic coach:', err)
    }
  }

  // If OpenAI is configured
  if (provider === 'openai' && openaiKey) {
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
              content:
                'You are YashFit AI Coach. Return strictly valid JSON with recommendation, supportingData, explanation, nextAction, actionHref, limitations.',
            },
            { role: 'user', content: query },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          return {
            recommendation: parsed.recommendation,
            supportingData: parsed.supportingData,
            explanation: parsed.explanation,
            nextAction: parsed.nextAction,
            actionHref: parsed.actionHref || '/command-center',
            limitations: parsed.limitations,
            provider: 'openai',
          }
        }
      }
    } catch (err) {
      console.warn('OpenAI Provider failed, falling back to deterministic coach:', err)
    }
  }

  // Default: Deterministic Rule-Based Fallback
  return generateDeterministicCoachResponse(query, context)
}
