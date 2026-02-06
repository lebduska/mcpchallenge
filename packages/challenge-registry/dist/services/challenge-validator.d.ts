/**
 * Challenge Validator
 *
 * Validates inputs, states, and business rules.
 * Pure validation functions with no side effects.
 */
import type { Difficulty } from '../types/engine';
import type { ChallengeDefinition } from '../types/challenge';
import type { ChallengeRegistry } from '../registry';
import type { SessionId, Session, SessionStatus } from './session-manager';
/**
 * Validation result
 */
export type ValidationResult<T = void> = ValidationSuccess<T> | ValidationFailure;
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
export type ValidationErrorCode = 'REQUIRED_FIELD_MISSING' | 'INVALID_FIELD_TYPE' | 'INVALID_FIELD_VALUE' | 'CHALLENGE_NOT_FOUND' | 'SESSION_NOT_FOUND' | 'SESSION_INVALID_STATE' | 'DIFFICULTY_NOT_SUPPORTED' | 'CUSTOM_VALIDATION_FAILED';
/**
 * Validate challenge exists
 */
export declare function validateChallengeExists(registry: ChallengeRegistry, challengeId: string): ValidationResult<ChallengeDefinition<any>>;
/**
 * Validate difficulty is supported by challenge
 */
export declare function validateDifficulty(challenge: ChallengeDefinition<any>, difficulty?: Difficulty): ValidationResult<Difficulty>;
/**
 * Validate session is in expected state
 */
export declare function validateSessionState(session: Session, expectedStatus: SessionStatus | SessionStatus[]): ValidationResult<void>;
/**
 * Validate required string field
 */
export declare function validateRequiredString(value: unknown, fieldName: string): ValidationResult<string>;
/**
 * Validate optional enum field
 */
export declare function validateEnum<T extends string>(value: unknown, fieldName: string, allowedValues: readonly T[], defaultValue?: T): ValidationResult<T>;
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
export declare class ChallengeValidator {
    private readonly registry;
    constructor(registry: ChallengeRegistry);
    /**
     * Validate start challenge input
     */
    validateStartChallenge(input: Record<string, unknown>): ValidationResult<{
        challenge: ChallengeDefinition<any>;
        difficulty: Difficulty;
        seed?: string;
    }>;
    /**
     * Validate make move input
     */
    validateMakeMove(input: Record<string, unknown>): ValidationResult<{
        sessionId: SessionId;
        move: string;
    }>;
    /**
     * Validate get state input
     */
    validateGetState(input: Record<string, unknown>): ValidationResult<{
        sessionId: SessionId;
    }>;
    /**
     * Validate get challenge input
     */
    validateGetChallenge(input: Record<string, unknown>): ValidationResult<{
        challenge: ChallengeDefinition<any>;
    }>;
    /**
     * Validate complete challenge input
     */
    validateCompleteChallenge(input: Record<string, unknown>): ValidationResult<{
        sessionId: SessionId;
    }>;
    /**
     * Validate session can accept moves
     */
    validateSessionCanPlay(session: Session): ValidationResult<void>;
    /**
     * Validate session can be completed
     */
    validateSessionCanComplete(session: Session): ValidationResult<void>;
}
export declare function createChallengeValidator(registry: ChallengeRegistry): ChallengeValidator;
//# sourceMappingURL=challenge-validator.d.ts.map