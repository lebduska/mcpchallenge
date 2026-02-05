/**
 * Challenge Validator
 *
 * Validates inputs, states, and business rules.
 * Pure validation functions with no side effects.
 */

import type { Difficulty } from '../types/engine';
import type { ChallengeId, ChallengeDefinition } from '../types/challenge';
import type { ChallengeRegistry } from '../registry';
import type { SessionId, Session, SessionStatus } from './session-manager';

// =============================================================================
// Types
// =============================================================================

/**
 * Validation result
 */
export type ValidationResult<T = void> =
  | ValidationSuccess<T>
  | ValidationFailure;

export interface ValidationSuccess<T> {
  readonly valid: true;
  readonly value: T;
}

export interface ValidationFailure {
  readonly valid: false;
  readonly error: ValidationError;
}

export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
}

export type ValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_FIELD_TYPE'
  | 'INVALID_FIELD_VALUE'
  | 'CHALLENGE_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_INVALID_STATE'
  | 'DIFFICULTY_NOT_SUPPORTED'
  | 'CUSTOM_VALIDATION_FAILED';

// =============================================================================
// Input Validators
// =============================================================================

/**
 * Validate challenge exists
 */
export function validateChallengeExists(
  registry: ChallengeRegistry,
  challengeId: string
): ValidationResult<ChallengeDefinition<any>> {
  const challenge = registry.getChallenge(challengeId as ChallengeId);

  if (!challenge) {
    return {
      valid: false,
      error: {
        code: 'CHALLENGE_NOT_FOUND',
        message: `Challenge not found: ${challengeId}`,
        field: 'challengeId',
      },
    };
  }

  return { valid: true, value: challenge };
}

/**
 * Validate difficulty is supported by challenge
 */
export function validateDifficulty(
  challenge: ChallengeDefinition<any>,
  difficulty?: Difficulty
): ValidationResult<Difficulty> {
  const diff = difficulty ?? 'medium';

  if (!challenge.difficulties.includes(diff)) {
    return {
      valid: false,
      error: {
        code: 'DIFFICULTY_NOT_SUPPORTED',
        message: `Difficulty '${diff}' not supported. Available: ${challenge.difficulties.join(', ')}`,
        field: 'difficulty',
        details: { available: challenge.difficulties },
      },
    };
  }

  return { valid: true, value: diff };
}

/**
 * Validate session is in expected state
 */
export function validateSessionState(
  session: Session,
  expectedStatus: SessionStatus | SessionStatus[]
): ValidationResult<void> {
  const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

  if (!statuses.includes(session.status)) {
    return {
      valid: false,
      error: {
        code: 'SESSION_INVALID_STATE',
        message: `Session is ${session.status}, expected: ${statuses.join(' or ')}`,
        details: { current: session.status, expected: statuses },
      },
    };
  }

  return { valid: true, value: undefined };
}

/**
 * Validate required string field
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string
): ValidationResult<string> {
  if (value === undefined || value === null) {
    return {
      valid: false,
      error: {
        code: 'REQUIRED_FIELD_MISSING',
        message: `${fieldName} is required`,
        field: fieldName,
      },
    };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      error: {
        code: 'INVALID_FIELD_TYPE',
        message: `${fieldName} must be a string`,
        field: fieldName,
        details: { received: typeof value },
      },
    };
  }

  if (value.trim() === '') {
    return {
      valid: false,
      error: {
        code: 'INVALID_FIELD_VALUE',
        message: `${fieldName} cannot be empty`,
        field: fieldName,
      },
    };
  }

  return { valid: true, value };
}

/**
 * Validate optional enum field
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
  defaultValue?: T
): ValidationResult<T> {
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) {
      return { valid: true, value: defaultValue };
    }
    return {
      valid: false,
      error: {
        code: 'REQUIRED_FIELD_MISSING',
        message: `${fieldName} is required`,
        field: fieldName,
      },
    };
  }

  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_FIELD_VALUE',
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        field: fieldName,
        details: { received: value, allowed: allowedValues },
      },
    };
  }

  return { valid: true, value: value as T };
}

// =============================================================================
// Challenge Validator Class
// =============================================================================

/**
 * Challenge Validator
 *
 * Provides validation methods with registry context.
 *
 * Responsibilities:
 * - Validate tool call inputs
 * - Validate business rules
 * - Provide clear error messages
 *
 * NOT responsible for:
 * - Game logic validation
 * - Move legality (that's EngineExecutor)
 */
export class ChallengeValidator {
  constructor(private readonly registry: ChallengeRegistry) {}

  /**
   * Validate start challenge input
   */
  validateStartChallenge(input: Record<string, unknown>): ValidationResult<{
    challenge: ChallengeDefinition<any>;
    difficulty: Difficulty;
    seed?: string;
  }> {
    // Validate challengeId
    const challengeIdResult = validateRequiredString(input.challengeId, 'challengeId');
    if (!challengeIdResult.valid) return challengeIdResult;

    // Validate challenge exists
    const challengeResult = validateChallengeExists(this.registry, challengeIdResult.value);
    if (!challengeResult.valid) return challengeResult;

    // Validate difficulty
    const difficultyResult = validateDifficulty(
      challengeResult.value,
      input.difficulty as Difficulty | undefined
    );
    if (!difficultyResult.valid) return difficultyResult;

    return {
      valid: true,
      value: {
        challenge: challengeResult.value,
        difficulty: difficultyResult.value,
        seed: input.seed as string | undefined,
      },
    };
  }

  /**
   * Validate make move input
   */
  validateMakeMove(input: Record<string, unknown>): ValidationResult<{
    sessionId: SessionId;
    move: string;
  }> {
    const sessionIdResult = validateRequiredString(input.sessionId, 'sessionId');
    if (!sessionIdResult.valid) return sessionIdResult;

    const moveResult = validateRequiredString(input.move, 'move');
    if (!moveResult.valid) return moveResult;

    return {
      valid: true,
      value: {
        sessionId: sessionIdResult.value as SessionId,
        move: moveResult.value,
      },
    };
  }

  /**
   * Validate get state input
   */
  validateGetState(input: Record<string, unknown>): ValidationResult<{
    sessionId: SessionId;
  }> {
    const sessionIdResult = validateRequiredString(input.sessionId, 'sessionId');
    if (!sessionIdResult.valid) return sessionIdResult;

    return {
      valid: true,
      value: { sessionId: sessionIdResult.value as SessionId },
    };
  }

  /**
   * Validate get challenge input
   */
  validateGetChallenge(input: Record<string, unknown>): ValidationResult<{
    challenge: ChallengeDefinition<any>;
  }> {
    const challengeIdResult = validateRequiredString(input.challengeId, 'challengeId');
    if (!challengeIdResult.valid) return challengeIdResult;

    const challengeResult = validateChallengeExists(this.registry, challengeIdResult.value);
    if (!challengeResult.valid) return challengeResult;

    return { valid: true, value: { challenge: challengeResult.value } };
  }

  /**
   * Validate complete challenge input
   */
  validateCompleteChallenge(input: Record<string, unknown>): ValidationResult<{
    sessionId: SessionId;
  }> {
    return this.validateGetState(input);
  }

  /**
   * Validate session can accept moves
   */
  validateSessionCanPlay(session: Session): ValidationResult<void> {
    return validateSessionState(session, 'active');
  }

  /**
   * Validate session can be completed
   */
  validateSessionCanComplete(session: Session): ValidationResult<void> {
    return validateSessionState(session, ['active', 'completed']);
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createChallengeValidator(
  registry: ChallengeRegistry
): ChallengeValidator {
  return new ChallengeValidator(registry);
}
