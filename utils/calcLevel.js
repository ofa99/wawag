export const LEVEL_THRESHOLDS = [
    { level: 1, min: 0 },
    { level: 2, min: 100 },
    { level: 3, min: 300 },
    { level: 4, min: 600 },
    { level: 5, min: 1000 },
    { level: 6, min: 1500 },
    { level: 7, min: 2500 }, // VIP Starts
    { level: 8, min: 4000 },
    { level: 9, min: 6000 },
    { level: 10, min: 10000 },
];

export const getLevel = (points) => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (points >= LEVEL_THRESHOLDS[i].min) {
            return LEVEL_THRESHOLDS[i].level;
        }
    }
    return 1;
};

export const getNextLevelProgress = (points) => {
    const currentLevel = getLevel(points);
    if (currentLevel >= 10) {
        return { current: points, max: points, percent: 100, nextLevel: 10 };
    }

    const currentThreshold = LEVEL_THRESHOLDS.find(l => l.level === currentLevel).min;
    const nextThreshold = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1).min;

    const progress = points - currentThreshold;
    const totalNeeded = nextThreshold - currentThreshold;
    const percent = Math.min(100, Math.max(0, (progress / totalNeeded) * 100));

    return {
        current: points,
        max: nextThreshold,
        percent,
        nextLevel: currentLevel + 1
    };
};
