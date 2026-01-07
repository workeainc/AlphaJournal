export interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
    type: "YES_NO" | "MULTIPLE_CHOICE" | "TEXT";
    weight: number;
    required: boolean;
    options?: string[]; // For MULTIPLE_CHOICE
}

export interface ChecklistResponse {
    itemId: string;
    value: string; // "YES", "NO", "CALM", etc.
}

export interface QualityScoreResult {
    score: number; // 0-100
    passedItems: number;
    totalItems: number;
    isPassing: boolean; // score >= 60
    failedItems: string[]; // IDs of failed items
}

/**
 * Calculates the quality score based on checklist responses.
 * 
 * Scoring Logic:
 * - Each item has a weight (typically 20 for 5 items = 100%)
 * - "Positive" answers contribute their full weight
 * - "Negative" answers contribute 0
 * - Passing threshold is 60%
 * 
 * Positive Answers:
 * - YES (for YES_NO)
 * - YES (for Trend Alignment)
 * - CALM (for Mental State)
 * - NO_NEWS (for Event Risk)
 */
export function calculateQualityScore(
    responses: ChecklistResponse[],
    items: ChecklistItem[]
): QualityScoreResult {
    let totalScore = 0;
    let passedCount = 0;
    const failedItems: string[] = [];

    // Create a map for quick lookup
    const responseMap = new Map(responses.map((r) => [r.itemId, r.value]));

    for (const item of items) {
        const response = responseMap.get(item.id);

        // If required item is missing, it's a fail
        if (item.required && !response) {
            failedItems.push(item.id);
            continue;
        }

        // Determine if the response is "positive"
        const isPassed = isPositiveResponse(response || "", item);

        if (isPassed) {
            totalScore += item.weight;
            passedCount++;
        } else {
            failedItems.push(item.id);
        }
    }

    return {
        score: totalScore,
        passedItems: passedCount,
        totalItems: items.length,
        isPassing: totalScore >= 60,
        failedItems,
    };
}

/**
 * Determines if a response is considered "positive" for scoring
 */
function isPositiveResponse(value: string, item: ChecklistItem): boolean {
    const upperValue = value.toUpperCase();

    // Define positive responses per item type
    const positiveAnswers = [
        "YES",
        "CALM",
        "NO_NEWS",
    ];

    return positiveAnswers.includes(upperValue);
}

/**
 * Validates that all required checklist items have responses
 */
export function validateChecklistComplete(
    responses: ChecklistResponse[],
    items: ChecklistItem[]
): { isValid: boolean; missingItems: string[] } {
    const responseMap = new Map(responses.map((r) => [r.itemId, r.value]));
    const missingItems: string[] = [];

    for (const item of items) {
        if (item.required && !responseMap.has(item.id)) {
            missingItems.push(item.id);
        }
    }

    return {
        isValid: missingItems.length === 0,
        missingItems,
    };
}
