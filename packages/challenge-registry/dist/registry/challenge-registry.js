/**
 * Challenge Registry
 *
 * Type-safe registry for challenge definitions with extensibility.
 */
// =============================================================================
// Challenge Registry
// =============================================================================
/**
 * Type-safe challenge registry with extensibility
 */
export class ChallengeRegistry {
    challenges = new Map();
    eventHandlers = new Set();
    registrationOrder = [];
    /**
     * Register a challenge
     *
     * @throws Error if challenge already exists (unless override=true)
     */
    register(challenge, options = {}) {
        const id = challenge.id;
        if (this.challenges.has(id) && !options.override) {
            throw new Error(`Challenge "${id}" is already registered. Use override option to replace.`);
        }
        const isUpdate = this.challenges.has(id);
        this.challenges.set(id, challenge);
        if (!isUpdate) {
            this.registrationOrder.push(id);
        }
        this.emit({
            type: isUpdate ? 'updated' : 'registered',
            challengeId: challenge.id,
            timestamp: Date.now(),
        });
        return this;
    }
    /**
     * Register multiple challenges
     */
    registerAll(challenges, options = {}) {
        for (const challenge of challenges) {
            this.register(challenge, options);
        }
        return this;
    }
    /**
     * Unregister a challenge
     */
    unregister(id) {
        const idStr = id;
        const existed = this.challenges.delete(idStr);
        if (existed) {
            const idx = this.registrationOrder.indexOf(idStr);
            if (idx !== -1) {
                this.registrationOrder.splice(idx, 1);
            }
            this.emit({
                type: 'unregistered',
                challengeId: id,
                timestamp: Date.now(),
            });
        }
        return existed;
    }
    /**
     * Get a challenge by ID with full type inference
     */
    getChallenge(id) {
        return this.challenges.get(id);
    }
    /**
     * Get a challenge by ID, throwing if not found
     */
    getChallengeOrThrow(id) {
        const challenge = this.getChallenge(id);
        if (!challenge) {
            throw new Error(`Challenge "${id}" not found`);
        }
        return challenge;
    }
    /**
     * Check if a challenge exists
     */
    has(id) {
        return this.challenges.has(id);
    }
    /**
     * List all challenges with optional filtering and sorting
     */
    listChallenges(filter, sort) {
        let challenges = Array.from(this.challenges.values());
        // Apply filters
        if (filter) {
            challenges = challenges.filter((c) => this.matchesFilter(c, filter));
        }
        // Sort
        if (sort) {
            challenges = this.sortChallenges(challenges, sort);
        }
        else {
            // Default: registration order
            challenges = challenges.sort((a, b) => {
                const aIdx = this.registrationOrder.indexOf(a.id);
                const bIdx = this.registrationOrder.indexOf(b.id);
                return aIdx - bIdx;
            });
        }
        // Map to list items
        return challenges.map((c) => this.toListItem(c));
    }
    /**
     * Get challenges by difficulty
     */
    getByDifficulty(difficulty) {
        return this.listChallenges({
            difficulty: { min: difficulty, max: difficulty },
        });
    }
    /**
     * Get challenges by learning concept
     */
    getByConcept(concept) {
        return this.listChallenges({
            concepts: [concept],
        });
    }
    /**
     * Get challenges by tag
     */
    getByTag(tag) {
        return this.listChallenges({
            tags: [tag],
        });
    }
    /**
     * Get all challenge IDs
     */
    getIds() {
        return this.registrationOrder.map((id) => id);
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const byDifficulty = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        };
        const byConcept = {
            tool_basics: 0,
            state_management: 0,
            error_handling: 0,
            strategy: 0,
            optimization: 0,
            multi_step: 0,
            real_time: 0,
            resource_management: 0,
        };
        let totalAchievements = 0;
        let totalPoints = 0;
        for (const challenge of this.challenges.values()) {
            byDifficulty[challenge.meta.difficulty]++;
            for (const concept of challenge.meta.concepts) {
                byConcept[concept]++;
            }
            totalAchievements += challenge.achievements.length;
            totalPoints += challenge.scoring.basePoints;
            for (const achievement of challenge.achievements) {
                totalPoints += achievement.points;
            }
        }
        return {
            totalChallenges: this.challenges.size,
            byDifficulty,
            byConcept,
            totalAchievements,
            totalPoints,
        };
    }
    /**
     * Get count of registered challenges
     */
    get size() {
        return this.challenges.size;
    }
    /**
     * Clear all challenges
     */
    clear() {
        const ids = [...this.challenges.keys()];
        this.challenges.clear();
        this.registrationOrder.length = 0;
        for (const id of ids) {
            this.emit({
                type: 'unregistered',
                challengeId: id,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Subscribe to registry events
     */
    on(handler) {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }
    /**
     * Iterate over all challenges
     */
    *[Symbol.iterator]() {
        for (const id of this.registrationOrder) {
            const challenge = this.challenges.get(id);
            if (challenge) {
                yield challenge;
            }
        }
    }
    /**
     * Export registry as plain object (for serialization)
     */
    toJSON() {
        const result = {};
        for (const challenge of this.challenges.values()) {
            result[challenge.id] = this.toListItem(challenge);
        }
        return result;
    }
    // ---------------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------------
    matchesFilter(challenge, filter) {
        // Difficulty filter
        if (filter.difficulty) {
            const diff = challenge.meta.difficulty;
            if (filter.difficulty.min !== undefined && diff < filter.difficulty.min) {
                return false;
            }
            if (filter.difficulty.max !== undefined && diff > filter.difficulty.max) {
                return false;
            }
        }
        // Concepts filter (any match)
        if (filter.concepts && filter.concepts.length > 0) {
            const hasConcept = filter.concepts.some((c) => challenge.meta.concepts.includes(c));
            if (!hasConcept) {
                return false;
            }
        }
        // Tags filter (any match)
        if (filter.tags && filter.tags.length > 0) {
            const challengeTags = challenge.meta.tags ?? [];
            const hasTag = filter.tags.some((t) => challengeTags.includes(t));
            if (!hasTag) {
                return false;
            }
        }
        // Engine difficulty filter
        if (filter.engineDifficulty) {
            if (!challenge.difficulties.includes(filter.engineDifficulty)) {
                return false;
            }
        }
        // Custom filter
        if (filter.custom && !filter.custom(challenge)) {
            return false;
        }
        return true;
    }
    sortChallenges(challenges, sort) {
        const multiplier = sort.order === 'desc' ? -1 : 1;
        return [...challenges].sort((a, b) => {
            let cmp = 0;
            switch (sort.by) {
                case 'name':
                    cmp = a.meta.name.localeCompare(b.meta.name);
                    break;
                case 'difficulty':
                    cmp = a.meta.difficulty - b.meta.difficulty;
                    break;
                case 'points':
                    cmp = a.scoring.basePoints - b.scoring.basePoints;
                    break;
                case 'registeredAt':
                    cmp = this.registrationOrder.indexOf(a.id) -
                        this.registrationOrder.indexOf(b.id);
                    break;
            }
            return cmp * multiplier;
        });
    }
    toListItem(challenge) {
        return {
            id: challenge.id,
            meta: challenge.meta,
            difficulties: challenge.difficulties,
            achievementCount: challenge.achievements.length,
            basePoints: challenge.scoring.basePoints,
        };
    }
    emit(event) {
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
            }
            catch {
                // Ignore handler errors
            }
        }
    }
}
// =============================================================================
// Factory & Singleton
// =============================================================================
/**
 * Create a new challenge registry
 */
export function createChallengeRegistry() {
    return new ChallengeRegistry();
}
/**
 * Global registry instance (lazy initialized)
 */
let globalRegistry = null;
/**
 * Get the global challenge registry
 */
export function getGlobalRegistry() {
    if (!globalRegistry) {
        globalRegistry = createChallengeRegistry();
    }
    return globalRegistry;
}
/**
 * Reset the global registry (for testing)
 */
export function resetGlobalRegistry() {
    globalRegistry?.clear();
    globalRegistry = null;
}
//# sourceMappingURL=challenge-registry.js.map