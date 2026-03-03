export const BADGE_SEEDS: {
  name: string;
  description: string;
  emoji: string;
  source: string;
  category: string;
  threshold: number | null;
}[] = [
  // ── batch ─────────────────────────────────────────────────────────
  { name: "Premier batch", description: "Premier batch cooking complété", emoji: "🍳", source: "predefined", category: "batch", threshold: 1 },
  { name: "Batch habitué", description: "5 batch cooking complétés", emoji: "🍳", source: "predefined", category: "batch", threshold: 5 },
  { name: "Batch master", description: "10 batch cooking complétés", emoji: "👨‍🍳", source: "predefined", category: "batch", threshold: 10 },
  { name: "Roi de la prep", description: "25 batch cooking complétés", emoji: "🫅", source: "predefined", category: "batch", threshold: 25 },

  // ── cuisine_monde ─────────────────────────────────────────────────
  { name: "Ambassadeur culinaire", description: "Plats de 20 cuisines différentes cumulées", emoji: "🌐", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "American dream", description: "A cuisiné un plat américain", emoji: "🇺🇸", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Couscous royal", description: "A cuisiné un plat maghrébin", emoji: "🇲🇦", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Dragon", description: "A cuisiné un plat chinois", emoji: "🇨🇳", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Globe-trotter", description: "Plats de 10 cuisines différentes cumulées", emoji: "✈️", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "K-food", description: "A cuisiné un plat coréen", emoji: "🇰🇷", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Maharaja", description: "A cuisiné un plat indien", emoji: "🇮🇳", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Mama mia", description: "A cuisiné un plat italien", emoji: "🇮🇹", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Mezze master", description: "A cuisiné un plat libanais ou turc", emoji: "🇱🇧", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Olé", description: "A cuisiné un plat espagnol", emoji: "🇪🇸", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Pad thaï lover", description: "A cuisiné un plat thaïlandais", emoji: "🇹🇭", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Samouraï", description: "A cuisiné un plat japonais", emoji: "🇯🇵", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Sombrero", description: "A cuisiné un plat mexicain", emoji: "🇲🇽", source: "predefined", category: "cuisine_monde", threshold: null },
  { name: "Tour du monde", description: "Plats de 5 cuisines différentes sur une semaine", emoji: "🌍", source: "predefined", category: "cuisine_monde", threshold: null },

  // ── fun ────────────────────────────────────────────────────────────
  { name: "Brunch du dimanche", description: "Un brunch complet le weekend", emoji: "🥂", source: "predefined", category: "fun", threshold: null },
  { name: "Comfort food", description: "5 plats réconfortants", emoji: "🤗", source: "predefined", category: "fun", threshold: null },
  { name: "Date night", description: "Plat élaboré pour 2 personnes", emoji: "💕", source: "predefined", category: "fun", threshold: null },
  { name: "Fait maison", description: "10 plats avec un élément fait maison", emoji: "🏠", source: "predefined", category: "fun", threshold: null },
  { name: "Meal prep god", description: "Batch cooking + semaine parfaite", emoji: "🙏", source: "predefined", category: "fun", threshold: null },
  { name: "One pot wonder", description: "5 plats en un seul récipient", emoji: "🫕", source: "predefined", category: "fun", threshold: null },
  { name: "Street food", description: "5 plats street food maison", emoji: "🛒", source: "predefined", category: "fun", threshold: null },
  { name: "Zéro gaspi", description: "Semaine sans ingrédient gaspillé", emoji: "♻️", source: "predefined", category: "fun", threshold: null },

  // ── ingredients ───────────────────────────────────────────────────
  { name: "Agrumes fan", description: "5 plats avec agrumes", emoji: "🍋", source: "predefined", category: "ingredients", threshold: null },
  { name: "Ail vampire", description: "5 plats bien aillés", emoji: "🧄", source: "predefined", category: "ingredients", threshold: null },
  { name: "Champignon hunter", description: "5 plats aux champignons", emoji: "🍄", source: "predefined", category: "ingredients", threshold: null },
  { name: "Choco lover", description: "5 préparations au chocolat", emoji: "🍫", source: "predefined", category: "ingredients", threshold: null },
  { name: "Douceur sucrée", description: "A cuisiné 5 plats ou desserts sucrés", emoji: "🍯", source: "predefined", category: "ingredients", threshold: null },
  { name: "Épicier", description: "A utilisé 10 épices différentes", emoji: "🫙", source: "predefined", category: "ingredients", threshold: null },
  { name: "Fromage addict", description: "10 plats avec fromage", emoji: "🧀", source: "predefined", category: "ingredients", threshold: null },
  { name: "Herbivore", description: "10 plats avec herbes fraîches", emoji: "🌿", source: "predefined", category: "ingredients", threshold: null },
  { name: "Herboriste", description: "A utilisé 8 herbes différentes", emoji: "🌱", source: "predefined", category: "ingredients", threshold: null },
  { name: "Roi du piquant", description: "A cuisiné 5 plats épicés", emoji: "🌶️", source: "predefined", category: "ingredients", threshold: null },

  // ── menus_generated ───────────────────────────────────────────────
  { name: "Curieux", description: "Premier menu généré", emoji: "🔍", source: "predefined", category: "menus_generated", threshold: 1 },
  { name: "Planificateur", description: "5 menus générés", emoji: "📋", source: "predefined", category: "menus_generated", threshold: 5 },
  { name: "Organisé", description: "10 menus générés", emoji: "🗂️", source: "predefined", category: "menus_generated", threshold: 10 },
  { name: "Stratège culinaire", description: "25 menus générés", emoji: "🧠", source: "predefined", category: "menus_generated", threshold: 25 },

  // ── nutrition ─────────────────────────────────────────────────────
  { name: "5 fruits et légumes", description: "Journée avec 5+ fruits et légumes", emoji: "🍎", source: "predefined", category: "nutrition", threshold: null },
  { name: "Bowl master", description: "5 bowls ou poke bowls", emoji: "🥙", source: "predefined", category: "nutrition", threshold: null },
  { name: "Fibre power", description: "10 plats riches en fibres", emoji: "🌾", source: "predefined", category: "nutrition", threshold: null },
  { name: "Léger comme une plume", description: "10 plats light", emoji: "🪶", source: "predefined", category: "nutrition", threshold: null },
  { name: "Miam les légumes", description: "15 plats avec 3+ légumes", emoji: "🥗", source: "predefined", category: "nutrition", threshold: null },
  { name: "Salade king", description: "5 salades composées", emoji: "🥗", source: "predefined", category: "nutrition", threshold: null },
  { name: "Sans sucre ajouté", description: "5 desserts sans sucre ajouté", emoji: "🚫", source: "predefined", category: "nutrition", threshold: null },
  { name: "Smoothie addict", description: "5 smoothies", emoji: "🥤", source: "predefined", category: "nutrition", threshold: null },

  // ── perfect_week ──────────────────────────────────────────────────
  { name: "Semaine parfaite", description: "Tous les repas validés sur une semaine", emoji: "⭐", source: "predefined", category: "perfect_week", threshold: 1 },
  { name: "Mois parfait", description: "4 semaines parfaites", emoji: "🌟", source: "predefined", category: "perfect_week", threshold: 4 },
  { name: "Trimestre parfait", description: "10 semaines parfaites", emoji: "✨", source: "predefined", category: "perfect_week", threshold: 10 },

  // ── petit_dej ─────────────────────────────────────────────────────
  { name: "Lève-tôt", description: "5 petits-déj validés", emoji: "🌅", source: "predefined", category: "petit_dej", threshold: 5 },
  { name: "Matinal", description: "15 petits-déj validés", emoji: "☀️", source: "predefined", category: "petit_dej", threshold: 15 },
  { name: "Le petit-déj c'est sacré", description: "30 petits-déj validés", emoji: "🥐", source: "predefined", category: "petit_dej", threshold: 30 },
  { name: "Jamais sans mon petit-déj", description: "50 petits-déj validés", emoji: "🍳", source: "predefined", category: "petit_dej", threshold: 50 },

  // ── photo ─────────────────────────────────────────────────────────
  { name: "Première photo", description: "Première photo de plat envoyée", emoji: "📸", source: "predefined", category: "photo", threshold: 1 },
  { name: "Instagrameur", description: "10 photos envoyées", emoji: "🤳", source: "predefined", category: "photo", threshold: 10 },
  { name: "Foodie", description: "25 photos envoyées", emoji: "🍴", source: "predefined", category: "photo", threshold: 25 },
  { name: "Photographe culinaire", description: "50 photos envoyées", emoji: "📷", source: "predefined", category: "photo", threshold: 50 },
  { name: "National Geographic de la bouffe", description: "100 photos envoyées", emoji: "🌍", source: "predefined", category: "photo", threshold: 100 },

  // ── proteines ─────────────────────────────────────────────────────
  { name: "Flexitarien", description: "Mix viande et végétarien sur une semaine", emoji: "🔄", source: "predefined", category: "proteines", threshold: null },
  { name: "Océan", description: "3 plats poisson en une semaine", emoji: "🌊", source: "predefined", category: "proteines", threshold: null },
  { name: "Poisson fan", description: "10 plats poisson ou fruits de mer", emoji: "🐟", source: "predefined", category: "proteines", threshold: null },
  { name: "Protéiné", description: "10 plats riches en protéines", emoji: "💪", source: "predefined", category: "proteines", threshold: null },
  { name: "Roi de la viande", description: "10 plats viande rouge", emoji: "🥩", source: "predefined", category: "proteines", threshold: null },
  { name: "Team poulet", description: "10 plats volaille", emoji: "🍗", source: "predefined", category: "proteines", threshold: null },
  { name: "Vegan warrior", description: "5 plats vegan", emoji: "🌱", source: "predefined", category: "proteines", threshold: null },
  { name: "Veggie lover", description: "10 plats végétariens", emoji: "🥬", source: "predefined", category: "proteines", threshold: null },

  // ── streak ────────────────────────────────────────────────────────
  { name: "Premier feu", description: "3 jours de cuisine d'affilée", emoji: "🔥", source: "predefined", category: "streak", threshold: 3 },
  { name: "Semaine de feu", description: "7 jours de cuisine d'affilée", emoji: "🔥", source: "predefined", category: "streak", threshold: 7 },
  { name: "Endurant", description: "14 jours de cuisine d'affilée", emoji: "💪", source: "predefined", category: "streak", threshold: 14 },
  { name: "Inarrêtable", description: "30 jours de cuisine d'affilée", emoji: "🚀", source: "predefined", category: "streak", threshold: 30 },
  { name: "Deux mois de flammes", description: "60 jours de cuisine d'affilée", emoji: "🌋", source: "predefined", category: "streak", threshold: 60 },
  { name: "Centenaire", description: "100 jours de cuisine d'affilée", emoji: "💯", source: "predefined", category: "streak", threshold: 100 },
  { name: "Légende", description: "365 jours de cuisine d'affilée", emoji: "👑", source: "predefined", category: "streak", threshold: 365 },

  // ── techniques ────────────────────────────────────────────────────
  { name: "Boulanger", description: "5 préparations avec pâte maison", emoji: "🍞", source: "predefined", category: "techniques", threshold: null },
  { name: "Grill master", description: "5 plats grillés ou barbecue", emoji: "🔥", source: "predefined", category: "techniques", threshold: null },
  { name: "Marinade master", description: "5 plats avec marinade", emoji: "🫗", source: "predefined", category: "techniques", threshold: null },
  { name: "Mijoté", description: "5 plats mijotés longtemps", emoji: "🍲", source: "predefined", category: "techniques", threshold: null },
  { name: "Pâtissier", description: "5 desserts réalisés", emoji: "🧁", source: "predefined", category: "techniques", threshold: null },
  { name: "Risotto boss", description: "3 risottos réalisés", emoji: "🍚", source: "predefined", category: "techniques", threshold: null },
  { name: "Roi des sauces", description: "5 sauces maison réalisées", emoji: "🫕", source: "predefined", category: "techniques", threshold: null },
  { name: "Soup king", description: "5 soupes ou veloutés", emoji: "🥣", source: "predefined", category: "techniques", threshold: null },
  { name: "Vapeur zen", description: "5 plats vapeur", emoji: "♨️", source: "predefined", category: "techniques", threshold: null },
  { name: "Wok star", description: "5 plats au wok", emoji: "🥘", source: "predefined", category: "techniques", threshold: null },

  // ── temps ─────────────────────────────────────────────────────────
  { name: "Challenge accepted", description: "Un plat de plus d'1 heure", emoji: "🏋️", source: "predefined", category: "temps", threshold: null },
  { name: "Chef pâtissier", description: "Un dessert complexe de 3+ étapes", emoji: "🎂", source: "predefined", category: "temps", threshold: null },
  { name: "Cuisine du soir", description: "20 dîners validés", emoji: "🌙", source: "predefined", category: "temps", threshold: null },
  { name: "Dimanche en cuisine", description: "A cuisiné un dimanche 5 fois", emoji: "🗓️", source: "predefined", category: "temps", threshold: null },
  { name: "Express", description: "10 plats de moins de 15 minutes", emoji: "⚡", source: "predefined", category: "temps", threshold: null },

  // ── volume ────────────────────────────────────────────────────────
  { name: "Premier pas", description: "Premier repas validé", emoji: "👣", source: "predefined", category: "volume", threshold: 1 },
  { name: "Lancé", description: "10 repas validés", emoji: "🏃", source: "predefined", category: "volume", threshold: 10 },
  { name: "Régulier", description: "25 repas validés", emoji: "📅", source: "predefined", category: "volume", threshold: 25 },
  { name: "Demi-centurion", description: "50 repas validés", emoji: "⚔️", source: "predefined", category: "volume", threshold: 50 },
  { name: "Centurion", description: "100 repas validés", emoji: "🛡️", source: "predefined", category: "volume", threshold: 100 },
  { name: "Machine à cuisiner", description: "250 repas validés", emoji: "🤖", source: "predefined", category: "volume", threshold: 250 },
  { name: "Demi-millier", description: "500 repas validés", emoji: "🏆", source: "predefined", category: "volume", threshold: 500 },
];
