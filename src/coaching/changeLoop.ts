import { changeStages } from './types.ts'
import type { ChangeStage, SafetyState } from './types.ts'
export function selectStage(requested: ChangeStage, safety: SafetyState): ChangeStage | 'SUSPENDED' {
  if (!changeStages.includes(requested)) throw new Error('Unknown stage')
  return safety === 'SAFETY_MODE' ? 'SUSPENDED' : requested
}
export function reviewStage(previous: ChangeStage): ChangeStage {
  return previous === 'TRACK' ? 'LEARN' : previous === 'LEARN' ? 'ADAPT' : 'TRACK'
}
