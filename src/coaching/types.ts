export const changeStages = ['OBSERVE', 'UNDERSTAND', 'ASK', 'REFLECT', 'CHALLENGE', 'DECIDE', 'ACT', 'TRACK', 'LEARN', 'ADAPT'] as const
export type ChangeStage = typeof changeStages[number]
export type SafetyState = 'NORMAL' | 'ELEVATED_CONCERN' | 'SAFETY_MODE'
export type CognitiveLoad = 'LOW' | 'STANDARD'
export type EvidenceTier = 'A' | 'B' | 'C' | 'D' | 'E'
export type UserIntent = 'LISTEN' | 'EXPLORE' | 'ACTION' | 'REVIEW' | 'DELEGATE_DECISION' | 'REST'
export interface Consent {
  coaching: boolean
  challenge: boolean
  memory: boolean
  resources: boolean
  analytics: boolean
  research: boolean
  proactive: boolean
  proactiveRejectedAt?: number
  neverAskProactive: boolean
}
export const defaultConsent: Consent = {
  coaching: true, challenge: false, memory: false, resources: false,
  analytics: false, research: false, proactive: false, neverAskProactive: false,
}
export interface SafetySignals {
  meaning?: 'distress' | 'danger' | 'ordinary'
  intent?: 'none' | 'unclear' | 'self-harm' | 'harm-other'
  immediacy?: 'none' | 'unclear' | 'immediate'
  capability?: 'none' | 'unknown' | 'available'
  persistence?: number
  context?: string
}
export interface SafetyAssessment {
  state: SafetyState
  reasonCodes: string[]
  source: 'local-dev' | 'evaluator' | 'fallback'
  signals: SafetySignals
}
export interface RelationshipAssessment {
  emotionalIntensity: 'LOW' | 'HIGH'
  cognitiveLoad: CognitiveLoad
  userIntent: UserIntent
  explicitInteractionIntent?: 'EXPRESS' | 'EXPLORE' | 'PLAN' | 'REST'
  interactionMode: 'RECEIVE' | 'UNDERSTAND' | 'ASK_PERMISSION' | 'COACH' | 'REST'
  permissionToChallenge: boolean
  responseLength: number
  questionBudget: 0 | 1
}
export interface EvidenceMetadata {
  tier: EvidenceTier
  method: string
  useCase: string
  limitation: string
}
export interface InterventionPlan {
  interventionId: string
  objective: string
  evidenceTier: EvidenceTier
  challengeLevel: 0 | 1
  cognitiveLoad: CognitiveLoad
  requiredConsent: Array<keyof Consent>
  reasonCodes: string[]
}
export interface QuestionPlan {
  type: 'permission' | 'clarification' | 'reflection' | 'action' | 'review'
  objective: string
  cognitiveLoad: CognitiveLoad
  challengeLevel: 0 | 1
  question: string
}
export interface ActionPlan {
  goal: string
  nextAction: string
  startTrigger: string
  expectedEffort: string
  barrier: string
  fallback: string
  reviewTime: string
  accepted: boolean
}
export interface TrackRecord {
  plan: string
  reality: string
  learned: string
  adaptation: string
}
export interface Reflection {
  reportedStatements: string[]
  facts: string[]
  interpretations: string[]
  assumptions: string[]
  emotions: string[]
  needs: string[]
}
// A user's words, a model suggestion, and a user-confirmed claim have different authority.
// Confirmed here means the user endorsed the wording; it does not verify the claim externally.
export interface UserUtterance {
  kind: 'USER_UTTERANCE'
  text: string
  sourceTurnId: string
}
export interface AIInference {
  kind: 'AI_INFERENCE'
  text: string
  sourceTurnId: string
  status: 'UNCONFIRMED'
}
export interface ExplicitUserFact {
  kind: 'EXPLICIT_USER_FACT'
  text: string
  sourceTurnId: string
  confirmedBy: 'USER'
  verification: 'SELF_REPORTED'
  confirmedAt: number
}
export interface MemoryItem {
  id: string
  text: string
  kind: 'WORKING_HYPOTHESIS' | 'CONFIRMED_PATTERN'
  createdAt: number
  relevantSessionIds: string[]
  category: 'strategy'
  origin?: 'AI_INFERENCE' | 'USER_AUTHORED'
  confirmedBy?: 'USER'
}
export interface OutcomeMetadata {
  clarityBefore?: number
  clarityAfter?: number
  agencyBefore?: number
  agencyAfter?: number
  feltUnderstood?: number
  helpfulness?: number
  nextStepAccepted?: boolean
}
export interface TurnContext {
  sessionId: string
  recentConversation: string[]
  safetySignals: SafetySignals
  safetyLatched: boolean
  stage: ChangeStage
  lowLoad: boolean
  goal: string
  problemType: 'general' | 'planning' | 'follow-through'
  preferences: { preferReflection: boolean }
  consent: Consent
  memories: MemoryItem[]
  explicitFacts: ExplicitUserFact[]
  recentOutcomes: OutcomeMetadata[]
  resourceCount: number
  previousQuestionAsked?: boolean
  history: {
    interventions: string[]
    resources: string[]
    actions: Array<{ accepted: boolean; completed?: boolean }>
  }
  track?: TrackRecord
}
export interface TurnPlan {
  stage: ChangeStage | 'SUSPENDED'
  coachingAllowed: boolean
  challengeAllowed: boolean
  resourceAllowed: boolean
  questionBudget: 0 | 1
  relationshipMode: RelationshipAssessment['interactionMode']
  objective: string
  memoryPolicy: 'SESSION_ONLY' | 'PROPOSE'
  followUpPolicy: 'USER_INITIATED'
  intervention?: InterventionPlan
  question?: QuestionPlan
}
export interface ModelResponse {
  kind: 'COACHING' | 'SUPPORT' | 'SAFETY'
  text: string
  questions: string[]
  challenge: boolean
  scientificClaim: boolean
}
export interface Resource {
  id: string
  title: string
  url: string
  summary: string
  authorization: 'PROJECT_AUTHORED'
  evidence: EvidenceMetadata
}
export interface ResourcePrescription {
  resourceId: string
  whyNow: string
  focusOn: string
  reflectionQuestion: string
  behaviorBridge: string
  evidenceTier: EvidenceTier
}
export interface CoachingTurn {
  id: string
  userInput: string
  userUtterance: UserUtterance
  aiInferences: AIInference[]
  context: TurnContext
  safety: SafetyAssessment
  relationship: RelationshipAssessment
  changeStage: TurnPlan['stage']
  plan: TurnPlan
  response: ModelResponse
  reflection: Reflection
  memoryProposals: MemoryItem[]
  action?: ActionPlan
  followUp?: TrackRecord
  resource?: ResourcePrescription
  outcome: OutcomeMetadata
  errors: Array<'PROVIDER_UNAVAILABLE' | 'INVALID_RESPONSE' | 'RESOURCE_UNAVAILABLE'>
}
export interface ModelAdapter {
  generate(request: { input: string; plan: TurnPlan; relationship: RelationshipAssessment }, signal: AbortSignal): Promise<unknown>
}
