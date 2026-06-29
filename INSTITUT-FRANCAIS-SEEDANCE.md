# Institut Français × Studia — Clips Seedance (à générer via MCP Higgsfield)

Fil conducteur : **Aïcha**, médiatrice culturelle à l'Institut Français de Libreville
(femme africaine, 30 ans, élégante, tenue wax moderne). On la suit du chapitre 0 au 7.
Continuité : générer Ch.0, puis réutiliser son `job_id` comme `medias[].value` (role `image`)
sur les chapitres suivants pour garder son identité. Ambiance qui glisse golden hour → nuit.

Workflow (skill seedance-cinematic-sowax) :
1. `models_explore` (type video) → confirmer durées/ratios/roles.
2. `get_cost: true` puis draft `count:1` basse résolution.
3. Itérer, puis HD.
4. `aspect_ratio: 16:9` (desktop) — refaire en `9:16` pour mobile.
5. Récupérer URL/job_id → extraire frames (ffmpeg) → remplacer les placeholders dans
   `src/components/institut/ScrollExperience.tsx` (champ vidéo de chaque chapitre).

Tous les prompts finissent par le négatif :
`--no text, watermarks, logos, distorted faces, extra limbs`

---

## Ch.0 — Ouverture
A confident African woman in modern wax attire walks toward the entrance of the Institut
Français in Libreville at golden hour, warm sunlight flaring through palm trees. Slow aerial
push in. Golden hour, volumetric light. Fluid slow motion. Premium, aspirational, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.1 — Le constat
The same African woman stands in the Institut Français courtyard, looking thoughtfully at
event posters fluttering on the walls, people passing softly behind her. Slow orbit around
her. Warm late-afternoon light. Normal speed. Contemplative, hopeful, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.2 — Le staff se forme
The African woman sits among colleagues in a bright training room, laptop screens glowing
to life as she learns, soft reflections on her face. Slow dolly in from the doorway. Cool
interior key light, warm screen glow. Normal speed. Focused, inspiring, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.3 — Elle forme la communauté
The African woman teaches a diverse group of young adults and expats around a table,
gesturing warmly, everyone engaged. Crane up then slow travelling across the room. Soft
overcast daylight. Normal speed. Warm, communal, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.4 — La plateforme (plan signature)
A glowing holographic dashboard interface assembles in mid-air from particles of light in
front of the African woman, panels and cards crystallizing. Static locked-off shot.
Volumetric god rays, deep blue dusk light. Fluid slow motion. Premium, futuristic, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.5 — Créer (image & vidéo)
Close on the African woman's hands and face lit by a screen as vivid images and short video
thumbnails bloom outward from a glowing cursor. Slow push in on the screen. Warm screen
glow, dark room. Fluid slow motion. Creative, magical, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.6 — Diffuser (WhatsApp)
Hundreds of soft green message bubbles lift off a phone and float out over the Libreville
skyline at blue hour, the African woman watching, smiling. Slow dolly out. Cool blue hour
light, green glows. Fluid slow motion. Uplifting, connected, cinematic.
--no text, watermarks, logos, distorted faces, extra limbs

## Ch.7 — Rayonner (réseaux)
Across a night view of Libreville, dozens of windows and phone screens light up one by one
like a constellation, the African woman silhouetted in foreground. Crane up toward the
glowing skyline. Night, warm and cool city lights. Fluid slow motion. Triumphant, radiant,
cinematic.
--no text, watermarks, logos, distorted faces, extra limbs
