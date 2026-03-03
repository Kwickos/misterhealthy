# Politique de securite

## Signaler une vulnerabilite

Si tu decouvres une faille de securite, **ne cree pas d'issue publique**.

Contacte les mainteneurs directement en envoyant un email ou un message prive avec :

1. Description de la vulnerabilite
2. Etapes pour la reproduire
3. Impact potentiel

Nous nous engageons a repondre sous 48h et a corriger les vulnerabilites critiques en priorite.

## Bonnes pratiques

- Ne commit jamais de secrets (`.env`, cles API, tokens)
- Utilise toujours les variables d'environnement pour les donnees sensibles
- Verifie que `.env` est bien dans `.gitignore` avant de push
