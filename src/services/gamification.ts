import {
  getOrCreateUserStats,
  updateUserStats,
  createMealValidation,
  awardBadge,
  getAllBadgeDefinitions,
  getBadgeByName,
  saveBadgeDefinition,
  getLatestMenu,
  getTodayValidations,
} from "./supabase.js";
import type { BadgeDefinition, UserStats, Meal, MenuData } from "../types.js";

// Level titles
const LEVEL_TITLES: Record<number, string> = {
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

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? LEVEL_TITLES[20]!;
}

// XP needed for next level: level * 50
export function xpForNextLevel(level: number): number {
  return level * 50;
}

// Calculate total XP needed to reach a given level (cumulative)
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += i * 50;
  }
  return total;
}

// Streak bonus XP
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 100;
  if (streak >= 14) return 50;
  if (streak >= 7) return 25;
  if (streak >= 3) return 10;
  return 0;
}

// Calculate XP for a single validation
export function calculateXP(hasPhoto: boolean, isFullDay: boolean): number {
  let xp = 10; // base
  if (hasPhoto) xp += 5;
  if (isFullDay) xp += 15;
  return xp;
}

// Check if level up happened, returns new level or null
export function checkLevelUp(currentXP: number, currentLevel: number): { newLevel: number; title: string } | null {
  const needed = xpForNextLevel(currentLevel);
  if (currentXP >= totalXpForLevel(currentLevel) + needed) {
    const newLevel = currentLevel + 1;
    return { newLevel, title: getLevelTitle(newLevel) };
  }
  return null;
}

// Update streak based on today's date
export function computeStreak(stats: UserStats, today: string): { current_streak: number; best_streak: number } {
  const lastDate = stats.last_validation_date;
  if (!lastDate) {
    return { current_streak: 1, best_streak: Math.max(1, stats.best_streak) };
  }

  const last = new Date(lastDate);
  const now = new Date(today);
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day, streak unchanged
    return { current_streak: stats.current_streak, best_streak: stats.best_streak };
  } else if (diffDays === 1) {
    // Consecutive day
    const newStreak = stats.current_streak + 1;
    return { current_streak: newStreak, best_streak: Math.max(newStreak, stats.best_streak) };
  } else {
    // Streak broken
    return { current_streak: 1, best_streak: stats.best_streak };
  }
}

// Check fixed badges against user stats, returns newly earned badge definitions
export async function checkFixedBadges(stats: UserStats): Promise<BadgeDefinition[]> {
  const allBadges = await getAllBadgeDefinitions();
  const earned: BadgeDefinition[] = [];

  for (const badge of allBadges) {
    if (badge.threshold === null) continue; // contextual badge

    let currentValue = 0;
    switch (badge.category) {
      case "streak":
        currentValue = stats.current_streak;
        break;
      case "volume":
        currentValue = stats.total_meals;
        break;
      case "photo":
        currentValue = stats.total_photos;
        break;
      case "batch":
        currentValue = stats.total_batch;
        break;
      case "perfect_week":
        currentValue = stats.perfect_weeks;
        break;
      case "petit_dej":
        // We need to track this separately - for now use a rough check
        // This will be passed in from the caller
        break;
      case "menus_generated":
        // This is checked at menu generation time, not here
        break;
    }

    if (currentValue >= badge.threshold) {
      earned.push(badge);
    }
  }

  return earned;
}

// Result of a validation
export interface ValidationResult {
  xpEarned: number;
  totalXp: number;
  streak: number;
  bestStreak: number;
  streakBonus: number;
  levelUp: { newLevel: number; title: string } | null;
  newBadges: BadgeDefinition[];
  level: number;
}

// Main orchestration: process a meal validation
export async function processValidation(
  userId: string,
  menuId: string,
  dayKey: string,
  mealKey: string,
  mealData: Meal,
  photoFileId?: string,
): Promise<ValidationResult> {
  const stats = await getOrCreateUserStats(userId);
  const today = new Date().toISOString().split("T")[0];

  // Check if full day (all meals validated today after this one)
  const todayValidations = await getTodayValidations(userId);
  const menu = await getLatestMenu(userId);
  let isFullDay = false;
  if (menu) {
    const menuData = menu.menu_data as MenuData;
    const dayMenu = menuData.days[dayKey];
    if (dayMenu) {
      const totalMeals = Object.keys(dayMenu).length;
      const validatedMeals = todayValidations.filter(v => v.day_key === dayKey).length + 1; // +1 for current
      isFullDay = validatedMeals >= totalMeals;
    }
  }

  // Calculate XP
  const hasPhoto = !!photoFileId;
  let xpEarned = calculateXP(hasPhoto, isFullDay);

  // Update streak
  const streakResult = computeStreak(stats, today);
  const streakBonus = getStreakBonus(streakResult.current_streak);
  // Only add streak bonus if streak just hit a milestone (wasn't already at this level)
  const prevStreakBonus = getStreakBonus(stats.current_streak);
  const newStreakBonus = streakBonus > prevStreakBonus ? streakBonus - prevStreakBonus : 0;
  xpEarned += newStreakBonus;

  // Save validation
  const validation = await createMealValidation({
    user_id: userId,
    menu_id: menuId,
    day_key: dayKey,
    meal_key: mealKey,
    photo_file_id: photoFileId,
    xp_earned: xpEarned,
  });

  // Update stats
  const newXp = stats.xp + xpEarned;
  const newTotalMeals = stats.total_meals + 1;
  const newTotalPhotos = stats.total_photos + (hasPhoto ? 1 : 0);

  await updateUserStats(userId, {
    xp: newXp,
    current_streak: streakResult.current_streak,
    best_streak: streakResult.best_streak,
    total_meals: newTotalMeals,
    total_photos: newTotalPhotos,
    last_validation_date: today,
  });

  // Check level up
  const updatedStats = { ...stats, xp: newXp, total_meals: newTotalMeals, total_photos: newTotalPhotos, current_streak: streakResult.current_streak, best_streak: streakResult.best_streak };
  const levelUp = checkLevelUp(newXp, stats.level);
  let currentLevel = stats.level;
  if (levelUp) {
    currentLevel = levelUp.newLevel;
    await updateUserStats(userId, { level: levelUp.newLevel });
  }

  // Check fixed badges
  const fixedBadgeCandidates = await checkFixedBadges(updatedStats);
  const newBadges: BadgeDefinition[] = [];

  for (const badge of fixedBadgeCandidates) {
    const awarded = await awardBadge(userId, badge.id, validation.id);
    if (awarded) newBadges.push(badge);
  }

  // Check contextual badges from meal data (assigned by Gemini at generation time)
  if (mealData.badges && mealData.badges.length > 0) {
    for (const badgeName of mealData.badges) {
      let badge = await getBadgeByName(badgeName);
      if (!badge) {
        // Gemini invented a new badge - save it
        badge = await saveBadgeDefinition(badgeName, `Badge attribué pour : ${mealData.name}`, "🏅");
      }
      const awarded = await awardBadge(userId, badge.id, validation.id);
      if (awarded) newBadges.push(badge);
    }
  }

  return {
    xpEarned,
    totalXp: newXp,
    streak: streakResult.current_streak,
    bestStreak: streakResult.best_streak,
    streakBonus: newStreakBonus,
    levelUp,
    newBadges,
    level: currentLevel,
  };
}
