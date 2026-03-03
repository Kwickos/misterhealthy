import { describe, it, expect, vi } from "vitest";

vi.mock("./supabase.js", () => ({
  supabase: {},
  getOrCreateUserStats: vi.fn(),
  updateUserStats: vi.fn(),
  createMealValidation: vi.fn(),
  awardBadge: vi.fn(),
  getAllBadgeDefinitions: vi.fn(),
  getBadgeByName: vi.fn(),
  saveBadgeDefinition: vi.fn(),
  getLatestMenu: vi.fn(),
  getTodayValidations: vi.fn(),
  getUserBadges: vi.fn(),
  getContextualBadgeNames: vi.fn(),
}));

import {
  getLevelTitle,
  xpForNextLevel,
  totalXpForLevel,
  getStreakBonus,
  calculateXP,
  checkLevelUp,
  computeStreak,
} from "./gamification.js";
import type { UserStats } from "../types.js";

function makeStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    id: "stat-1",
    user_id: "user-1",
    xp: 0,
    level: 1,
    current_streak: 0,
    best_streak: 0,
    total_meals: 0,
    total_photos: 0,
    total_batch: 0,
    perfect_weeks: 0,
    last_validation_date: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getLevelTitle", () => {
  it("returns 'Débutant' for level 1", () => {
    expect(getLevelTitle(1)).toBe("Débutant");
  });

  it("returns 'Marmiton' for level 2", () => {
    expect(getLevelTitle(2)).toBe("Marmiton");
  });

  it("returns 'Chef étoilé' for level 16", () => {
    expect(getLevelTitle(16)).toBe("Chef étoilé");
  });

  it("returns 'Gordon Ramsay' for level 20", () => {
    expect(getLevelTitle(20)).toBe("Gordon Ramsay");
  });

  it("returns 'Gordon Ramsay' for levels above 20", () => {
    expect(getLevelTitle(21)).toBe("Gordon Ramsay");
    expect(getLevelTitle(50)).toBe("Gordon Ramsay");
    expect(getLevelTitle(100)).toBe("Gordon Ramsay");
  });

  it("returns correct titles for all defined levels", () => {
    const expected: Record<number, string> = {
      1: "Débutant",
      2: "Marmiton",
      3: "Commis",
      4: "Commis confirmé",
      5: "Cuistot",
      6: "Cuistot confirmé",
      7: "Cuistot expérimenté",
      8: "Sous-chef",
      9: "Sous-chef confirmé",
      10: "Sous-chef expérimenté",
      11: "Demi-chef",
      12: "Chef",
      13: "Chef confirmé",
      14: "Chef expérimenté",
      15: "Chef exécutif",
      16: "Chef étoilé",
      17: "Chef 2 étoiles",
      18: "Chef 3 étoiles",
      19: "Meilleur Ouvrier",
      20: "Gordon Ramsay",
    };
    for (const [level, title] of Object.entries(expected)) {
      expect(getLevelTitle(Number(level))).toBe(title);
    }
  });
});

describe("xpForNextLevel", () => {
  it("returns level * 50", () => {
    expect(xpForNextLevel(1)).toBe(50);
    expect(xpForNextLevel(2)).toBe(100);
    expect(xpForNextLevel(5)).toBe(250);
    expect(xpForNextLevel(10)).toBe(500);
    expect(xpForNextLevel(20)).toBe(1000);
  });
});

describe("totalXpForLevel", () => {
  it("returns 0 for level 1 (no XP needed to be level 1)", () => {
    expect(totalXpForLevel(1)).toBe(0);
  });

  it("returns 50 for level 2 (need level 1 XP: 1*50)", () => {
    expect(totalXpForLevel(2)).toBe(50);
  });

  it("returns cumulative sum for level 3 (50 + 100 = 150)", () => {
    expect(totalXpForLevel(3)).toBe(150);
  });

  it("returns cumulative sum for level 5 (50+100+150+200 = 500)", () => {
    expect(totalXpForLevel(5)).toBe(500);
  });

  it("returns correct cumulative sum for higher levels", () => {
    // Sum of i*50 for i=1..9 = 50*(1+2+...+9) = 50*45 = 2250
    expect(totalXpForLevel(10)).toBe(2250);
  });
});

describe("getStreakBonus", () => {
  it("returns 0 for streak < 3", () => {
    expect(getStreakBonus(0)).toBe(0);
    expect(getStreakBonus(1)).toBe(0);
    expect(getStreakBonus(2)).toBe(0);
  });

  it("returns 10 for streak 3-6", () => {
    expect(getStreakBonus(3)).toBe(10);
    expect(getStreakBonus(4)).toBe(10);
    expect(getStreakBonus(6)).toBe(10);
  });

  it("returns 25 for streak 7-13", () => {
    expect(getStreakBonus(7)).toBe(25);
    expect(getStreakBonus(10)).toBe(25);
    expect(getStreakBonus(13)).toBe(25);
  });

  it("returns 50 for streak 14-29", () => {
    expect(getStreakBonus(14)).toBe(50);
    expect(getStreakBonus(20)).toBe(50);
    expect(getStreakBonus(29)).toBe(50);
  });

  it("returns 100 for streak 30+", () => {
    expect(getStreakBonus(30)).toBe(100);
    expect(getStreakBonus(50)).toBe(100);
    expect(getStreakBonus(365)).toBe(100);
  });
});

describe("calculateXP", () => {
  it("returns base 10 XP with no photo and not full day", () => {
    expect(calculateXP(false, false)).toBe(10);
  });

  it("returns 15 XP with photo only", () => {
    expect(calculateXP(true, false)).toBe(15);
  });

  it("returns 25 XP with full day only", () => {
    expect(calculateXP(false, true)).toBe(25);
  });

  it("returns 30 XP with both photo and full day", () => {
    expect(calculateXP(true, true)).toBe(30);
  });
});

describe("checkLevelUp", () => {
  it("returns null when not enough XP to level up", () => {
    // Level 1 needs 50 XP to level up. totalXpForLevel(1) = 0, needed = 50
    // So need currentXP >= 0 + 50 = 50
    expect(checkLevelUp(49, 1)).toBeNull();
  });

  it("returns null when XP is just below threshold", () => {
    // Level 2: totalXpForLevel(2) = 50, xpForNextLevel(2) = 100
    // Need currentXP >= 50 + 100 = 150
    expect(checkLevelUp(149, 2)).toBeNull();
  });

  it("returns new level and title when XP is exactly at threshold", () => {
    // Level 1 -> 2: need 50 XP
    const result = checkLevelUp(50, 1);
    expect(result).not.toBeNull();
    expect(result!.newLevel).toBe(2);
    expect(result!.title).toBe("Marmiton");
  });

  it("returns new level and title when XP exceeds threshold", () => {
    const result = checkLevelUp(200, 1);
    expect(result).not.toBeNull();
    expect(result!.newLevel).toBe(2);
    expect(result!.title).toBe("Marmiton");
  });

  it("levels up from level 2 to level 3 correctly", () => {
    // Level 2: totalXpForLevel(2) = 50, xpForNextLevel(2) = 100
    // Need >= 150
    const result = checkLevelUp(150, 2);
    expect(result).not.toBeNull();
    expect(result!.newLevel).toBe(3);
    expect(result!.title).toBe("Commis");
  });

  it("levels up to Gordon Ramsay at level 20", () => {
    // Level 19 -> 20: totalXpForLevel(19) + xpForNextLevel(19)
    const threshold = totalXpForLevel(19) + xpForNextLevel(19);
    const result = checkLevelUp(threshold, 19);
    expect(result).not.toBeNull();
    expect(result!.newLevel).toBe(20);
    expect(result!.title).toBe("Gordon Ramsay");
  });
});

describe("computeStreak", () => {
  it("returns streak 1 on first validation (no lastDate)", () => {
    const stats = makeStats({ last_validation_date: null, current_streak: 0, best_streak: 0 });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(1);
    expect(result.best_streak).toBe(1);
  });

  it("preserves best_streak on first validation if already higher", () => {
    const stats = makeStats({ last_validation_date: null, current_streak: 0, best_streak: 5 });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(1);
    expect(result.best_streak).toBe(5);
  });

  it("keeps streak unchanged on same day", () => {
    const stats = makeStats({
      last_validation_date: "2026-03-03",
      current_streak: 5,
      best_streak: 10,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(5);
    expect(result.best_streak).toBe(10);
  });

  it("increments streak on consecutive day", () => {
    const stats = makeStats({
      last_validation_date: "2026-03-02",
      current_streak: 5,
      best_streak: 10,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(6);
    expect(result.best_streak).toBe(10);
  });

  it("updates best_streak when current exceeds it on consecutive day", () => {
    const stats = makeStats({
      last_validation_date: "2026-03-02",
      current_streak: 10,
      best_streak: 10,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(11);
    expect(result.best_streak).toBe(11);
  });

  it("resets streak to 1 when gap > 1 day", () => {
    const stats = makeStats({
      last_validation_date: "2026-03-01",
      current_streak: 5,
      best_streak: 10,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(1);
    expect(result.best_streak).toBe(10);
  });

  it("preserves best_streak when streak resets", () => {
    const stats = makeStats({
      last_validation_date: "2026-02-25",
      current_streak: 3,
      best_streak: 15,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(1);
    expect(result.best_streak).toBe(15);
  });

  it("resets streak after a long gap", () => {
    const stats = makeStats({
      last_validation_date: "2026-01-01",
      current_streak: 30,
      best_streak: 30,
    });
    const result = computeStreak(stats, "2026-03-03");
    expect(result.current_streak).toBe(1);
    expect(result.best_streak).toBe(30);
  });
});
