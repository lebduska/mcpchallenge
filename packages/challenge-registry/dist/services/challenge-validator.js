/**
 * Challenge Validator
 *
 * Validates inputs, states, and business rules.
 * Pure validation functions with no side effects.
 */
// =============================================================================
// Input Validators
// =============================================================================
/**
 * Validate challenge exists
 */
export function validateChallengeExists(registry, challengeId) {
    const challenge = registry.getChallenge(challengeId);
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
export function validateDifficulty(challenge, difficulty) {
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
export function validateSessionState(session, expectedStatus) {
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
export function validateRequiredString(value, fieldName) {
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
export function validateEnum(value, fieldName, allowedValues, defaultValue) {
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
    if (typeof value !== 'string' || !allowedValues.includes(value)) {
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
    return { valid: true, value: value };
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
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * Validate start challenge input
     */
    validateStartChallenge(input) {
        // Validate challengeId
        const challengeIdResult = validateRequiredString(input.challengeId, 'challengeId');
        if (!challengeIdResult.valid)
            return challengeIdResult;
        // Validate challenge exists
        const challengeResult = validateChallengeExists(this.registry, challengeIdResult.value);
        if (!challengeResult.valid)
            return challengeResult;
        // Validate difficulty
        const difficultyResult = validateDifficulty(challengeResult.value, input.difficulty);
        if (!difficultyResult.valid)
            return difficultyResult;
        return {
            valid: true,
            value: {
                challenge: challengeResult.value,
                difficulty: difficultyResult.value,
                seed: input.seed,
            },
        };
    }
    /**
     * Validate make move input
     */
    validateMakeMove(input) {
        const sessionIdResult = validateRequiredString(input.sessionId, 'sessionId');
        if (!sessionIdResult.valid)
            return sessionIdResult;
        const moveResult = validateRequiredString(input.move, 'move');
        if (!moveResult.valid)
            return moveResult;
        return {
            valid: true,
            value: {
                sessionId: sessionIdResult.value,
                move: moveResult.value,
            },
        };
    }
    /**
     * Validate get state input
     */
    validateGetState(input) {
        const sessionIdResult = validateRequiredString(input.sessionId, 'sessionId');
        if (!sessionIdResult.valid)
            return sessionIdResult;
        return {
            valid: true,
            value: { sessionId: sessionIdResult.value },
        };
    }
    /**
     * Validate get challenge input
     */
    validateGetChallenge(input) {
        const challengeIdResult = validateRequiredString(input.challengeId, 'challengeId');
        if (!challengeIdResult.valid)
            return challengeIdResult;
        const challengeResult = validateChallengeExists(this.registry, challengeIdResult.value);
        if (!challengeResult.valid)
            return challengeResult;
        return { valid: true, value: { challenge: challengeResult.value } };
    }
    /**
     * Validate complete challenge input
     */
    validateCompleteChallenge(input) {
        return this.validateGetState(input);
    }
    /**
     * Validate session can accept moves
     */
    validateSessionCanPlay(session) {
        return validateSessionState(session, 'active');
    }
    /**
     * Validate session can be completed
     */
    validateSessionCanComplete(session) {
        return validateSessionState(session, ['active', 'completed']);
    }
}
// =============================================================================
// Factory
// =============================================================================
export function createChallengeValidator(registry) {
    return new ChallengeValidator(registry);
}
//# sourceMappingURL=challenge-validator.js.map