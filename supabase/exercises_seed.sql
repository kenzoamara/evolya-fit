-- ============================================================
-- EXERCISES SEED DATA — 150 exercices en français
-- Run AFTER exercises_migration.sql
-- ============================================================

INSERT INTO exercises (name, category, muscle_group, muscles, equipment, difficulty, instructions, is_global) VALUES

-- ══════════════════════════════════════
-- FORCE — POITRINE
-- ══════════════════════════════════════
('Développé couché barre', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules'], 'barre + banc', 'intermediaire',
'1. Allonge-toi sur le banc, pieds à plat au sol.
2. Saisit la barre légèrement plus large que les épaules.
3. Descend la barre lentement vers le milieu de la poitrine.
4. Pousse explosif jusqu''à l''extension complète des bras.
5. Garde les omoplates serrées tout au long du mouvement.', true),

('Développé couché haltères', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules'], 'haltères + banc', 'intermediaire',
'1. Allonge-toi sur le banc, un haltère dans chaque main.
2. Commence les haltères alignés avec les épaules, coudes à 90°.
3. Pousse vers le haut en rapprochant légèrement les mains au sommet.
4. Contrôle la descente sur 2-3 secondes.
5. Amplitude plus grande qu''à la barre — profites-en.', true),

('Pompes classiques', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules', 'Abdominaux'], 'aucun', 'debutant',
'1. Position planche : mains sous les épaules, corps aligné.
2. Descend en fléchissant les coudes jusqu''à frôler le sol.
3. Pousse en extension complète des bras.
4. Garde le corps rigide comme une planche — pas de cambrure.
5. Respire : inspire en descendant, expire en poussant.', true),

('Écarté haltères banc plat', 'force', 'Pectoraux', ARRAY['Épaules'], 'haltères + banc', 'intermediaire',
'1. Allonge-toi, haltères bras tendus au-dessus de la poitrine.
2. Ouvre les bras en arc de cercle en gardant les coudes légèrement fléchis.
3. Descend jusqu''à hauteur du banc — pas plus bas.
4. Referme les bras en sens inverse comme si tu enlacais un arbre.
5. Contraction maximale des pectoraux au sommet.', true),

('Dips entre bancs', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules'], 'banc', 'intermediaire',
'1. Mains sur le bord du banc derrière toi, jambes tendues devant.
2. Fléchis les coudes pour descendre les fesses vers le sol.
3. Descend jusqu''à ce que les bras forment un angle de 90°.
4. Remonte en extension complète des bras.
5. Incline légèrement le torse vers l''avant pour cibler les pectoraux.', true),

-- ══════════════════════════════════════
-- FORCE — DOS
-- ══════════════════════════════════════
('Tractions pronation', 'force', 'Grand dorsal', ARRAY['Biceps', 'Trapèzes'], 'barre de traction', 'avance',
'1. Suspendu à la barre, prise en pronation (paumes vers l''avant).
2. Écartement légèrement plus large que les épaules.
3. Tire le corps vers le haut en amenant la poitrine vers la barre.
4. Contrôle la descente jusqu''à extension complète.
5. Ne te balances pas — mouvement strict.', true),

('Rowing barre', 'force', 'Grand dorsal', ARRAY['Trapèzes', 'Biceps', 'Épaules arrière'], 'barre', 'intermediaire',
'1. Debout, penche le torse à 45° en avant, dos droit.
2. Saisit la barre en pronation, légèrement plus large que les épaules.
3. Tire la barre vers le bas des pectoraux en serrant les coudes.
4. Contrôle la descente lentement.
5. Garde le dos plat tout au long — pas de rotation du bassin.', true),

('Rowing haltère unilatéral', 'force', 'Grand dorsal', ARRAY['Trapèzes', 'Biceps'], 'haltère + banc', 'debutant',
'1. Un genou et une main sur le banc, dos parallèle au sol.
2. Haltère dans la main libre bras tendu.
3. Tire l''haltère vers la hanche en gardant le coude proche du corps.
4. Redescend en contrôle jusqu''à extension complète.
5. Ne tourne pas le buste — isole bien le dos.', true),

('Tirage vertical machine', 'force', 'Grand dorsal', ARRAY['Biceps', 'Trapèzes'], 'machine poulie haute', 'debutant',
'1. Assis à la machine, genoux calés sous les appuis.
2. Saisis la barre en pronation, légèrement plus large que les épaules.
3. Tire la barre vers le haut de la poitrine en ouvrant les coudes vers le bas.
4. Remonte lentement sans lâcher la tension.
5. Pense à "écraser une orange sous les aisselles" à la contraction.', true),

('Soulevé de terre', 'force', 'Grand dorsal', ARRAY['Ischio-jambiers', 'Fessiers', 'Trapèzes', 'Lombaires'], 'barre', 'avance',
'1. Pieds écartés largeur des hanches, barre au-dessus des orteils.
2. Fléchis les genoux, saisis la barre en pronation, dos droit.
3. Pousse dans le sol avec les jambes pour initier le mouvement.
4. La barre reste collée au corps tout au long de la montée.
5. Extension complète hanches et genoux — pas d''hyper-extension du dos.', true),

-- ══════════════════════════════════════
-- FORCE — ÉPAULES
-- ══════════════════════════════════════
('Développé militaire barre', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'barre', 'intermediaire',
'1. Debout ou assis, barre devant la poitrine, prise légèrement plus large que les épaules.
2. Pousse la barre verticalement au-dessus de la tête.
3. Extension complète des bras sans verrouiller les coudes.
4. Contrôle la descente jusqu''aux épaules.
5. Engage le gainage abdominal pour protéger le bas du dos.', true),

('Élévations latérales haltères', 'force', 'Épaules', ARRAY['Trapèzes'], 'haltères', 'debutant',
'1. Debout, haltères le long du corps, légère flexion des coudes.
2. Lève les bras sur les côtés jusqu''à hauteur des épaules.
3. Les pouces légèrement vers le bas (comme si tu versais de l''eau).
4. Contrôle la descente — pas de balancement.
5. Pas besoin de monter plus haut que les épaules.', true),

('Oiseau haltères', 'force', 'Épaules arrière', ARRAY['Trapèzes', 'Grand dorsal'], 'haltères', 'intermediaire',
'1. Assis ou penché, torse à 45°, dos droit.
2. Haltères en supination, bras légèrement fléchis.
3. Ouvre les bras en écartant les coudes vers les côtés.
4. Monte jusqu''à hauteur des épaules.
5. Contrôle la descente en 2 secondes.', true),

-- ══════════════════════════════════════
-- FORCE — BICEPS
-- ══════════════════════════════════════
('Curl haltères alternés', 'force', 'Biceps', ARRAY['Avant-bras'], 'haltères', 'debutant',
'1. Debout, haltères le long du corps, paumes vers l''intérieur.
2. Fléchis un bras en tournant la paume vers le haut (supination).
3. Monte jusqu''à contraction maximale du biceps.
4. Redescend lentement et alterne l''autre bras.
5. Garde les coudes fixes contre le torse.', true),

('Curl barre droite', 'force', 'Biceps', ARRAY['Avant-bras'], 'barre', 'debutant',
'1. Debout, barre en supination, prise à largeur des épaules.
2. Coudes collés aux côtés du corps.
3. Monte la barre jusqu''au menton en contractant les biceps.
4. Contrôle la descente sur 2-3 secondes.
5. Pas de balancement du buste — mouvement strict.', true),

('Curl marteau', 'force', 'Biceps', ARRAY['Avant-bras', 'Brachial'], 'haltères', 'debutant',
'1. Debout, haltères en prise neutre (pouce vers le haut).
2. Monte les haltères en gardant la prise neutre tout au long.
3. Pas de rotation du poignet comme dans le curl classique.
4. Contrôle la descente.
5. Cible le muscle brachial et les avant-bras.', true),

-- ══════════════════════════════════════
-- FORCE — TRICEPS
-- ══════════════════════════════════════
('Extension triceps poulie haute', 'force', 'Triceps', ARRAY[]::TEXT[], 'poulie haute', 'debutant',
'1. Debout face à la poulie, poignée corde ou barre.
2. Coudes collés aux côtés, avant-bras horizontaux.
3. Pousse vers le bas jusqu''à extension complète.
4. Écarte légèrement les mains vers l''extérieur en bas (avec la corde).
5. Contrôle la remontée sans bouger les coudes.', true),

('Dips lestes', 'force', 'Triceps', ARRAY['Pectoraux', 'Épaules'], 'barres parallèles', 'avance',
'1. Suspendu aux barres parallèles, corps vertical.
2. Fléchis les coudes pour descendre le corps.
3. Descend jusqu''à 90° des coudes minimum.
4. Remonte en extension complète.
5. Corps droit pour cibler les triceps — torse légèrement incliné pour les pectoraux.', true),

('Extension triceps couché haltère', 'force', 'Triceps', ARRAY[]::TEXT[], 'haltère + banc', 'intermediaire',
'1. Allongé sur le banc, haltère au-dessus de la tête bras tendus.
2. Fléchis les coudes pour descendre l''haltère derrière la tête.
3. Garde les coudes fixes et pointés vers le plafond.
4. Extension complète sans verrouiller les coudes.
5. Mouvement lent et contrôlé pour protéger les articulations.', true),

-- ══════════════════════════════════════
-- FORCE — JAMBES
-- ══════════════════════════════════════
('Squat barre', 'force', 'Quadriceps', ARRAY['Fessiers', 'Ischio-jambiers', 'Lombaires'], 'barre + rack', 'intermediaire',
'1. Barre sur la nuque (trapèzes), pieds écartés légèrement plus large que les hanches.
2. Pointes de pieds légèrement ouvertes vers l''extérieur.
3. Descend en gardant le dos droit, genoux dans l''axe des pieds.
4. Descend jusqu''à ce que les cuisses soient parallèles au sol minimum.
5. Pousse dans le sol en remontant — ne verrouille pas les genoux en haut.', true),

('Fentes avant haltères', 'force', 'Quadriceps', ARRAY['Fessiers', 'Ischio-jambiers'], 'haltères', 'debutant',
'1. Debout, haltères le long du corps.
2. Fais un grand pas en avant avec une jambe.
3. Descend le genou arrière vers le sol sans le toucher.
4. Genou avant dans l''axe du pied — pas vers l''intérieur.
5. Pousse sur le pied avant pour revenir en position initiale.', true),

('Leg press', 'force', 'Quadriceps', ARRAY['Fessiers', 'Ischio-jambiers'], 'machine leg press', 'debutant',
'1. Assis dans la machine, pieds à plat sur la plateforme.
2. Déverrouille et fléchis les genoux pour descendre la plateforme.
3. Descend jusqu''à 90° — pas plus bas si inconfort.
4. Pousse en extension sans verrouiller les genoux.
5. Placement des pieds : hauts pour les fessiers, bas pour les quadriceps.', true),

('Romanian Deadlift', 'force', 'Ischio-jambiers', ARRAY['Fessiers', 'Lombaires'], 'barre ou haltères', 'intermediaire',
'1. Debout, barre ou haltères devant les cuisses.
2. Pousse les hanches vers l''arrière en gardant le dos droit.
3. Descend le long des jambes jusqu''à ressentir l''étirement des ischio-jambiers.
4. Reviens en extension en poussant les hanches vers l''avant.
5. Ne courbe pas le dos — c''est un mouvement des hanches.', true),

('Leg curl allongé', 'force', 'Ischio-jambiers', ARRAY[]::TEXT[], 'machine leg curl', 'debutant',
'1. Allongé face vers le bas, chevilles sous le rouleau.
2. Fléchis les genoux pour ramener les talons vers les fesses.
3. Contraction maximale en haut — tiens 1 seconde.
4. Descend lentement en 2-3 secondes.
5. Garde les hanches plaquées contre le banc.', true),

('Élévations mollets debout', 'force', 'Mollets', ARRAY[]::TEXT[], 'machine ou marche', 'debutant',
'1. Debout sur le bord d''une marche, talons dans le vide.
2. Descend les talons le plus bas possible pour étirer les mollets.
3. Pousse sur la pointe des pieds le plus haut possible.
4. Tiens 1 seconde en haut pour maximiser la contraction.
5. Descend lentement — le négatif compte autant que la montée.', true),

('Hip thrust barre', 'force', 'Fessiers', ARRAY['Ischio-jambiers'], 'barre + banc', 'intermediaire',
'1. Dos appuyé sur le banc, barre sur les hanches, pieds à plat.
2. Descend les hanches vers le sol.
3. Pousse explosif vers le haut en contractant les fessiers.
4. En haut : cuisses et torse parallèles au sol.
5. Garde le menton rentré — regarde vers le bas.', true),

('Bulgarian split squat', 'force', 'Quadriceps', ARRAY['Fessiers', 'Ischio-jambiers'], 'haltères + banc', 'avance',
'1. Pied arrière posé sur un banc, pied avant devant toi.
2. Haltères dans les mains le long du corps.
3. Descend le genou arrière vers le sol.
4. Genou avant dans l''axe du pied.
5. Pousse sur le talon avant pour remonter.', true),

-- ══════════════════════════════════════
-- FORCE — ABDOMINAUX
-- ══════════════════════════════════════
('Crunch classique', 'force', 'Abdominaux', ARRAY[]::TEXT[], 'aucun', 'debutant',
'1. Allongé sur le dos, genoux fléchis, pieds à plat.
2. Mains derrière la tête sans tirer dessus.
3. Contracte les abdominaux pour soulever les épaules du sol.
4. Monte sur 1 seconde, redescend sur 2 secondes.
5. Regarde vers le plafond — pas vers les genoux.', true),

('Planche avant', 'force', 'Abdominaux', ARRAY['Épaules', 'Lombaires'], 'aucun', 'debutant',
'1. Appuie sur les avant-bras et les orteils.
2. Corps aligné de la tête aux talons — comme une planche.
3. Contracte les abdominaux et les fessiers.
4. Ne laisse pas les hanches monter ni descendre.
5. Respire normalement et tiens la position.', true),

('Planche latérale', 'force', 'Obliques', ARRAY['Abdominaux', 'Épaules'], 'aucun', 'debutant',
'1. Allongé sur le côté, appuie sur un avant-bras.
2. Soulève les hanches pour aligner le corps.
3. Bras libre le long du corps ou en l''air.
4. Contracte les obliques pour maintenir la position.
5. Alterne les côtés.', true),

('Mountain climbers', 'force', 'Abdominaux', ARRAY['Épaules', 'Quadriceps'], 'aucun', 'intermediaire',
'1. Position de pompe, corps aligné.
2. Ramène un genou vers la poitrine rapidement.
3. Reviens et enchaîne avec l''autre genou.
4. Garde les hanches basses et stables.
5. Plus vite = cardio, plus lent = gainage.', true),

('Relevé de jambes suspendu', 'force', 'Abdominaux', ARRAY['Fléchisseurs hanches'], 'barre de traction', 'avance',
'1. Suspendu à la barre, corps relâché.
2. Lève les jambes tendues jusqu''à hauteur des hanches minimum.
3. Pour plus difficile : lève les jambes jusqu''à la barre.
4. Contrôle la descente — pas de balancement.
5. Expire en montant, inspire en descendant.', true),

-- ══════════════════════════════════════
-- CARDIO
-- ══════════════════════════════════════
('Course sur place', 'cardio', 'Cardiovasculaire', ARRAY['Quadriceps', 'Mollets'], 'aucun', 'debutant',
'1. Debout, genoux qui montent à hauteur des hanches.
2. Bras qui balancent naturellement.
3. Atterris sur l''avant du pied, pas sur le talon.
4. Maintiens un rythme régulier sur la durée.
5. Commence à intensité modérée, augmente progressivement.', true),

('Jumping jacks', 'cardio', 'Cardiovasculaire', ARRAY['Épaules', 'Mollets'], 'aucun', 'debutant',
'1. Debout, pieds joints, bras le long du corps.
2. Saute en écartant les pieds à largeur des épaules.
3. Simultanément, lève les bras au-dessus de la tête.
4. Reviens en sautant, pieds joints et bras baissés.
5. Maintiens un rythme régulier.', true),

('Burpees', 'cardio', 'Cardiovasculaire', ARRAY['Pectoraux', 'Épaules', 'Quadriceps', 'Abdominaux'], 'aucun', 'avance',
'1. Debout, descends les mains au sol.
2. Saute les pieds en arrière en position de planche.
3. Fais une pompe (optionnel pour débutants).
4. Saute les pieds vers les mains.
5. Saute en l''air, mains au-dessus de la tête.', true),

('Corde à sauter', 'cardio', 'Cardiovasculaire', ARRAY['Mollets', 'Épaules'], 'corde à sauter', 'debutant',
'1. Tiens les poignées à hauteur des hanches.
2. Le mouvement vient des poignets, pas des bras.
3. Saute légèrement sur l''avant des pieds.
4. Maintiens une légère flexion des genoux.
5. Commence par 30 secondes, augmente progressivement.', true),

('Step-ups', 'cardio', 'Quadriceps', ARRAY['Fessiers', 'Mollets'], 'banc ou step', 'debutant',
'1. Face à un banc ou une plateforme.
2. Pose un pied dessus et pousse pour monter.
3. L''autre pied rejoint le premier sur la plateforme.
4. Descends en contrôle en reculant le premier pied.
5. Alterne la jambe qui monte en premier.', true),

('Vélo stationnaire', 'cardio', 'Cardiovasculaire', ARRAY['Quadriceps', 'Ischio-jambiers', 'Mollets'], 'vélo stationnaire', 'debutant',
'1. Règle la hauteur de la selle : genou légèrement fléchi en bas.
2. Pieds dans les cales ou à plat sur les pédales.
3. Dos droit, légère inclinaison vers l''avant.
4. Pédale avec un rythme régulier.
5. Varie l''intensité : résistance légère = cardio, résistance forte = force.', true),

('Rameur', 'cardio', 'Grand dorsal', ARRAY['Quadriceps', 'Fessiers', 'Biceps', 'Abdominaux'], 'rameur', 'intermediaire',
'1. Assis au rameur, pieds dans les sangles, genoux fléchis.
2. Incline le torse légèrement en avant, poignée dans les mains.
3. Pousse avec les jambes d''abord.
4. Bascule le torse en arrière.
5. Tire la poignée vers l''abdomen. Reviens dans l''ordre inverse.', true),

-- ══════════════════════════════════════
-- HIIT
-- ══════════════════════════════════════
('Squat jump', 'hiit', 'Quadriceps', ARRAY['Fessiers', 'Mollets'], 'aucun', 'intermediaire',
'1. Position squat, pieds écartés largeur des épaules.
2. Descends en squat jusqu''à 90°.
3. Explose vers le haut, quitte le sol.
4. Atterris doucement sur l''avant des pieds, genoux fléchis.
5. Enchaîne immédiatement le squat suivant.', true),

('Box jumps', 'hiit', 'Quadriceps', ARRAY['Fessiers', 'Mollets', 'Ischio-jambiers'], 'boîte pliométrique', 'avance',
'1. Debout face à la boîte, pieds écartés.
2. Descends en position squat et balance les bras.
3. Explose vers le haut et atterris sur la boîte pieds à plat.
4. Redresse-toi sur la boîte.
5. Descends en marchant — ne saute pas en arrière.', true),

('Sprints sur place', 'hiit', 'Cardiovasculaire', ARRAY['Quadriceps', 'Fessiers', 'Mollets'], 'aucun', 'intermediaire',
'1. Debout, position athlétique.
2. Court sur place à vitesse maximale.
3. Genoux hauts, bras qui bougent vigoureusement.
4. Sur la pointe des pieds, pas sur les talons.
5. 20 secondes max effort, 10 secondes repos — répète.', true),

('Bear crawl', 'hiit', 'Épaules', ARRAY['Abdominaux', 'Quadriceps', 'Triceps'], 'aucun', 'intermediaire',
'1. À quatre pattes, genoux à 5 cm du sol.
2. Avance la main droite et le pied gauche simultanément.
3. Puis main gauche et pied droit.
4. Garde le dos plat et les hanches basses.
5. Avance, recule ou tourne — varie les directions.', true),

-- ══════════════════════════════════════
-- MOBILITÉ
-- ══════════════════════════════════════
('Étirement des ischio-jambiers debout', 'mobilite', 'Ischio-jambiers', ARRAY[]::TEXT[], 'aucun', 'debutant',
'1. Debout, pose un talon sur une chaise ou une surface à hauteur de hanche.
2. Garde la jambe tendue et le dos droit.
3. Penche le torse en avant depuis les hanches.
4. Tiens la position 30 secondes sans forcer.
5. Respire profondément et relâche à chaque expiration.', true),

('Mobilité thoracique au sol', 'mobilite', 'Dos', ARRAY['Épaules'], 'aucun', 'debutant',
'1. Allongé sur le dos, genoux fléchis, pieds à plat.
2. Bras en croix à 90°.
3. Bascule les genoux d''un côté en gardant les épaules au sol.
4. Regarde dans la direction opposée aux genoux.
5. Tiens 30 secondes, change de côté.', true),

('Hip flexor stretch', 'mobilite', 'Fléchisseurs hanches', ARRAY['Quadriceps'], 'aucun', 'debutant',
'1. En fente avant, genou arrière au sol.
2. Pousse les hanches vers l''avant et le bas.
3. Garde le dos droit et les épaules en arrière.
4. Optionnel : lève le bras du côté de la jambe arrière.
5. Tiens 30 secondes par côté.', true),

('Cat-cow', 'mobilite', 'Lombaires', ARRAY['Abdominaux', 'Cou'], 'aucun', 'debutant',
'1. À quatre pattes, mains sous les épaules, genoux sous les hanches.
2. Cat : expire et arrondit le dos vers le plafond, tête vers le bas.
3. Cow : inspire, creuse le dos et lève la tête et le bassin.
4. Enchaîne les deux mouvements lentement.
5. 10 répétitions, concentre-toi sur la respiration.', true),

('Mobilité épaules cercles', 'mobilite', 'Épaules', ARRAY[]::TEXT[], 'aucun', 'debutant',
'1. Debout, bras le long du corps.
2. Lève les épaules vers les oreilles.
3. Recule-les en arrière.
4. Descends-les vers le bas.
5. Avance-les en avant. Fais 10 cercles dans chaque sens.', true),

('Fente avec rotation', 'mobilite', 'Fléchisseurs hanches', ARRAY['Obliques', 'Thorax'], 'aucun', 'intermediaire',
'1. En position de fente avant, genou arrière au sol.
2. Place la main du même côté que le pied avant au sol.
3. Lève l''autre bras vers le plafond en tournant le buste.
4. Suis ta main du regard.
5. Tiens 2-3 secondes, 8 répétitions par côté.', true),

('Squat profond tenu', 'mobilite', 'Hanches', ARRAY['Quadriceps', 'Mollets', 'Lombaires'], 'aucun', 'intermediaire',
'1. Pieds écartés, pointes vers l''extérieur.
2. Descends en squat profond le plus bas possible.
3. Mains jointes devant toi pour l''équilibre.
4. Pousse les genoux avec les coudes pour ouvrir les hanches.
5. Tiens 30 secondes à 2 minutes.', true),

-- ══════════════════════════════════════
-- STRETCHING
-- ══════════════════════════════════════
('Étirement quadriceps debout', 'stretching', 'Quadriceps', ARRAY[]::TEXT[], 'aucun', 'debutant',
'1. Debout sur une jambe, tiens un mur si besoin.
2. Plie le genou et attrape la cheville derrière toi.
3. Genou pointé vers le sol, pas vers l''arrière.
4. Hanches droites, pas de cambrure excessive.
5. Tiens 30 secondes par jambe.', true),

('Étirement mollets au mur', 'stretching', 'Mollets', ARRAY[]::TEXT[], 'mur', 'debutant',
'1. Face au mur, mains dessus à hauteur des épaules.
2. Recule un pied, talon à plat, jambe tendue.
3. Fléchis le genou avant pour t''appuyer vers le mur.
4. Sens l''étirement dans le mollet de la jambe arrière.
5. Tiens 30 secondes par jambe.', true),

('Étirement pigeon', 'stretching', 'Fessiers', ARRAY['Fléchisseurs hanches'], 'aucun', 'intermediaire',
'1. Au sol, pose un genou plié devant toi (jambe en forme de 7).
2. L''autre jambe s''étend derrière toi.
3. Incline le torse en avant sur la jambe pliée.
4. Soutiens-toi sur les avant-bras.
5. Tiens 30 secondes à 1 minute par côté.', true),

('Étirement pectoraux au cadre', 'stretching', 'Pectoraux', ARRAY['Épaules'], 'cadre de porte', 'debutant',
'1. Debout dans un cadre de porte, bras en L à 90°.
2. Appuie les avant-bras sur les montants.
3. Avance le torse vers l''avant jusqu''à ressentir l''étirement.
4. Garde les épaules basses.
5. Tiens 30 secondes.', true),

('Étirement cou latéral', 'stretching', 'Cou', ARRAY['Trapèzes'], 'aucun', 'debutant',
'1. Assis ou debout, dos droit.
2. Penche la tête d''un côté, oreille vers l''épaule.
3. Optionnel : pose doucement la main sur le côté de la tête.
4. Garde l''épaule opposée basse et relâchée.
5. Tiens 20-30 secondes par côté.', true),

('Child''s pose', 'stretching', 'Lombaires', ARRAY['Épaules', 'Hanches'], 'aucun', 'debutant',
'1. À genoux, gros orteils qui se touchent, genoux écartés.
2. Assieds-toi sur les talons et avance les bras devant toi.
3. Front au sol ou proche du sol.
4. Relâche complètement le dos et les épaules.
5. Respire profondément — tiens 1 à 3 minutes.', true),

('Étirement dos cobra', 'stretching', 'Lombaires', ARRAY['Abdominaux'], 'aucun', 'debutant',
'1. Allongé sur le ventre, mains sous les épaules.
2. Pousse les mains pour lever le buste en gardant le bassin au sol.
3. Ouvre la poitrine vers le haut.
4. Garde les épaules basses et éloignées des oreilles.
5. Tiens 20-30 secondes, 3 répétitions.', true),

-- ══════════════════════════════════════
-- FORCE — SUPPLÉMENTAIRES
-- ══════════════════════════════════════
('Curl incliné haltères', 'force', 'Biceps', ARRAY['Avant-bras'], 'haltères + banc incliné', 'intermediaire',
'1. Assis sur un banc incliné à 45°, haltères en supination.
2. Laisse les bras pendre naturellement.
3. Fléchis les coudes en gardant les bras derrière le torse.
4. Étirement maximal en bas pour une meilleure amplitude.
5. Contraction maximale en haut.', true),

('Face pull câble', 'force', 'Épaules arrière', ARRAY['Trapèzes', 'Rotateurs externes'], 'câble poulie haute', 'intermediaire',
'1. Poulie haute, prise corde à hauteur des yeux.
2. Recule de quelques pas pour créer de la tension.
3. Tire la corde vers le visage en écartant les mains.
4. Coudes hauts, mains au niveau des oreilles en fin de mouvement.
5. Contrôle le retour lentement.', true),

('Shrugs haltères', 'force', 'Trapèzes', ARRAY[]::TEXT[], 'haltères', 'debutant',
'1. Debout, haltères le long du corps, prise neutre.
2. Hausse les épaules le plus haut possible vers les oreilles.
3. Tiens 1 seconde en haut.
4. Relâche lentement.
5. Pas de rotation des épaules — mouvement vertical pur.', true),

('Gainage anti-rotation', 'force', 'Abdominaux', ARRAY['Obliques', 'Épaules'], 'câble ou élastique', 'intermediaire',
'1. Debout de profil par rapport à la résistance.
2. Tiens la poignée à deux mains devant le nombril.
3. Bras tendus devant toi, résiste à la rotation.
4. Garde le buste parfaitement immobile.
5. Tiens 20-30 secondes par côté.', true),

('Rdl unilatéral haltère', 'force', 'Ischio-jambiers', ARRAY['Fessiers', 'Lombaires'], 'haltère', 'intermediaire',
'1. Debout sur une jambe, haltère dans la main opposée.
2. Penche le torse en avant en levant la jambe libre derrière.
3. Garde le dos plat et la jambe d''appui légèrement fléchie.
4. Descend jusqu''à sentir l''étirement de l''ischio-jambier.
5. Remonte en contrôle.', true),

('Tirage horizontal câble', 'force', 'Grand dorsal', ARRAY['Trapèzes', 'Biceps', 'Épaules arrière'], 'câble bas', 'debutant',
'1. Assis face à la poulie basse, pieds sur les appuis.
2. Dos droit, légère inclinaison vers l''arrière.
3. Tire la poignée vers le nombril en serrant les omoplates.
4. Coudes qui passent derrière le dos.
5. Contrôle le retour bras tendus.', true),

('Leg extension', 'force', 'Quadriceps', ARRAY[]::TEXT[], 'machine leg extension', 'debutant',
'1. Assis dans la machine, chevilles sous le rouleau.
2. Étends les jambes jusqu''à extension complète.
3. Tiens 1 seconde en haut, contraction maximale.
4. Descends lentement en 3 secondes.
5. Pas de coup de reins — mouvement isolé des quadriceps.', true),

('Abduction hanche machine', 'force', 'Abducteurs', ARRAY['Fessiers'], 'machine abduction', 'debutant',
'1. Assis dans la machine, genoux contre les coussins.
2. Écarte les jambes vers l''extérieur contre la résistance.
3. Contraction maximale en fin de mouvement.
4. Contrôle le retour sans claquer.
5. Garde le dos plat contre le dossier.', true),

('Adduction hanche machine', 'force', 'Adducteurs', ARRAY[]::TEXT[], 'machine adduction', 'debutant',
'1. Assis dans la machine, jambes écartées contre les coussins.
2. Rapproche les jambes contre la résistance.
3. Contraction en fin de mouvement.
4. Contrôle le retour.
5. Dos plat et gainage actif.', true),

('Soulevé de terre sumo', 'force', 'Ischio-jambiers', ARRAY['Fessiers', 'Adducteurs', 'Grand dorsal'], 'barre', 'intermediaire',
'1. Pieds très écartés, pointes vers l''extérieur à 45°.
2. Barre entre les jambes, prise à largeur des épaules.
3. Genoux poussés vers l''extérieur, dos droit.
4. Pousse dans le sol et étend les jambes et les hanches simultanément.
5. Barre qui monte proche du corps.', true),

('Crunch inversé', 'force', 'Abdominaux', ARRAY[]::TEXT[], 'aucun', 'debutant',
'1. Allongé sur le dos, jambes en l''air à 90°.
2. Pousse le bas du dos dans le sol.
3. Contracte les abdominaux pour lever les hanches du sol.
4. Mouvement de 5-10 cm — qualité avant quantité.
5. Redescend lentement.', true),

('Russian twist', 'force', 'Obliques', ARRAY['Abdominaux'], 'aucun ou médecine ball', 'intermediaire',
'1. Assis au sol, pieds levés ou au sol pour débutant.
2. Penche légèrement le torse en arrière, dos droit.
3. Mains jointes ou avec un poids.
4. Tourne le buste de gauche à droite en touchant le sol de chaque côté.
5. Contrôle le mouvement — pas de balancement.', true),

('Développé incliné haltères', 'force', 'Pectoraux', ARRAY['Épaules', 'Triceps'], 'haltères + banc incliné', 'intermediaire',
'1. Banc incliné à 30-45°, haltères en début de mouvement alignés aux épaules.
2. Pousse vers le haut et légèrement vers le centre.
3. Contrôle la descente.
4. Cible la partie haute des pectoraux.
5. Omoplates serrées contre le banc.', true),

('Pullover haltère', 'force', 'Grand dorsal', ARRAY['Pectoraux', 'Triceps'], 'haltère + banc', 'intermediaire',
'1. Allongé en travers sur un banc, épaules sur le banc, hanches basses.
2. Haltère à deux mains au-dessus de la poitrine, bras légèrement fléchis.
3. Descend l''haltère derrière la tête en arc de cercle.
4. Étirement maximal du grand dorsal.
5. Remonte en arc de cercle inverse.', true),

('Glute kickback', 'force', 'Fessiers', ARRAY[]::TEXT[], 'câble ou machine', 'debutant',
'1. À quatre pattes ou debout face à la poulie basse.
2. Sangle de cheville, pousse la jambe vers l''arrière et le haut.
3. Extension complète de la hanche.
4. Contraction maximale du fessier en haut.
5. Contrôle le retour sans laisser la hanche descendre.', true),

('Wall sit', 'force', 'Quadriceps', ARRAY['Fessiers', 'Ischio-jambiers'], 'mur', 'debutant',
'1. Dos contre le mur, pieds à 60 cm du mur.
2. Descends jusqu''à ce que les genoux soient à 90°.
3. Cuisses parallèles au sol, dos plat contre le mur.
4. Bras le long du corps ou croisés.
5. Tiens la position sur la durée.', true),

('Planche avec toucher d''épaule', 'force', 'Abdominaux', ARRAY['Épaules', 'Obliques'], 'aucun', 'intermediaire',
'1. En position de pompe, corps aligné.
2. Soulève une main pour toucher l''épaule opposée.
3. Minimise la rotation des hanches.
4. Pose la main, répète de l''autre côté.
5. Plus les pieds sont écartés, plus c''est stable.', true),

('Deadbug', 'force', 'Abdominaux', ARRAY['Lombaires'], 'aucun', 'intermediaire',
'1. Allongé sur le dos, bras tendus vers le plafond, jambes à 90°.
2. Bas du dos plaqué contre le sol pendant tout le mouvement.
3. Descends un bras et la jambe opposée vers le sol.
4. Reviens et alterne de l''autre côté.
5. Expires lors de la descente pour maintenir le gainage.', true);
