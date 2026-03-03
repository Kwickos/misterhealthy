import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import type { Profile, MenuData } from "../types.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SYSTEM_PROMPT = `Tu es un nutritionniste et chef cuisinier expert. Tu génères des menus hebdomadaires personnalisés en JSON strictement structuré.

Règles obligatoires :
1. Adapter les calories et macronutriments au profil de l'utilisateur (poids, taille, âge, objectif)
2. Respecter strictement les restrictions alimentaires
3. N'utiliser QUE le matériel cuisine disponible dans le profil
4. TOUJOURS favoriser la réutilisation des ingrédients sur la semaine : si un ingrédient est acheté, l'utiliser dans au minimum 2-3 recettes
5. Minimiser le gaspillage : ne jamais demander une petite quantité d'un ingrédient périssable sans le réutiliser dans la semaine
6. Adapter les quantités au nombre de personnes indiqué
7. Recettes réalistes, accessibles, avec temps de préparation honnêtes
8. Si batch cooking activé : regrouper les préparations en une session (typiquement dimanche), préciser clairement quoi préparer à l'avance et comment les plats de la semaine réutilisent ces préparations
9. Varier les saveurs et textures sur la semaine
10. Ne générer QUE les jours et repas demandés
11. Répondre en français

Règles CRITIQUES pour les recettes (steps) :
12. Chaque recette DOIT être autonome et complète. Ne JAMAIS présupposer qu'une préparation existe sans expliquer comment la faire.
13. Détailler TOUTES les étapes de préparation : découpe des légumes, préparation des sauces, assaisonnement, cuisson avec températures et durées précises.
14. Si un plat utilise une préparation batch cooking, l'étape doit dire "Reprendre la sauce bolognaise préparée dimanche" ET donner l'alternative complète si elle n'a pas été préparée.
15. Indiquer les temps de cuisson précis (ex: "Faire revenir 5 min à feu moyen" au lieu de "Faire revenir").
16. Chaque étape doit être une action claire et unique. Minimum 4-5 étapes par recette.`;

function buildUserPrompt(profile: Profile, extraInstructions?: string): string {
  const lines = [
    `Profil utilisateur :`,
    `- Poids : ${profile.weight ?? "non renseigné"} kg`,
    `- Taille : ${profile.height ?? "non renseigné"} cm`,
    `- Âge : ${profile.age ?? "non renseigné"} ans`,
    `- Objectif : ${profile.goal}`,
    `- Nombre de personnes : ${profile.servings}`,
    `- Repas souhaités : ${profile.meals_config.join(", ")}`,
    `- Jours souhaités : ${profile.menu_days.join(", ")}`,
    `- Batch cooking : ${profile.batch_cooking ? "oui" : "non"}`,
    `- Restrictions alimentaires : ${profile.dietary_restrictions.length > 0 ? profile.dietary_restrictions.join(", ") : "aucune"}`,
    `- Équipement cuisine : ${profile.kitchen_equipment.join(", ")}`,
  ];
  if (profile.extra_preferences) {
    lines.push(`- Préférences supplémentaires : ${profile.extra_preferences}`);
  }
  if (extraInstructions) {
    lines.push(`\nInstructions spéciales pour cette semaine : ${extraInstructions}`);
  }
  lines.push(`\nGénère le menu de la semaine en JSON.`);
  return lines.join("\n");
}

function buildResponseSchema(profile: Profile) {
  const mealSchema = {
    type: "object" as const,
    properties: {
      name: { type: "string" as const },
      prep_time: { type: "string" as const },
      ingredients: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            name: { type: "string" as const },
            quantity: { type: "number" as const },
            unit: { type: "string" as const },
          },
          required: ["name", "quantity", "unit"],
        },
      },
      steps: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["name", "prep_time", "ingredients", "steps"],
  };

  const dayProperties: Record<string, typeof mealSchema> = {};
  for (const meal of profile.meals_config) {
    dayProperties[meal] = mealSchema;
  }

  const daysProperties: Record<string, object> = {};
  for (const day of profile.menu_days) {
    daysProperties[day] = {
      type: "object" as const,
      properties: dayProperties,
      required: profile.meals_config,
    };
  }

  const schema: Record<string, unknown> = {
    type: "object",
    properties: {
      days: {
        type: "object",
        properties: daysProperties,
        required: profile.menu_days,
      },
    },
    required: ["days"],
  };

  if (profile.batch_cooking) {
    (schema.properties as Record<string, unknown>).batch_cooking = {
      type: "object",
      properties: {
        day: { type: "string" },
        preparations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: { type: "string" },
              duration: { type: "string" },
            },
            required: ["task", "duration"],
          },
        },
      },
      required: ["day", "preparations"],
    };
    (schema.required as string[]).push("batch_cooking");
  }

  return schema;
}

export async function generateMenu(
  profile: Profile,
  extraInstructions?: string
): Promise<MenuData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: buildUserPrompt(profile, extraInstructions),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(profile),
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text) as MenuData;
}

export { buildUserPrompt, buildResponseSchema };
