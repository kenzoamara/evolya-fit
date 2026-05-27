-- ============================================================
-- EXERCICES PECTORAUX & ÉPAULES — seed v2
-- Insère uniquement si le nom n'existe pas déjà en global
-- ============================================================

INSERT INTO exercises (name, category, muscle_group, muscles, equipment, difficulty, instructions, is_global)
SELECT name, category, muscle_group, muscles, equipment, difficulty, instructions, true
FROM (VALUES

  ('Chest press machine', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules antérieures'], 'machine chest press', 'debutant',
  '1
Assieds-toi sur la machine chest press, dos plaqué contre le dossier, pieds au sol et poignées au niveau de la ligne médiane de la poitrine.
2
Saisis les poignées avec une prise stable et aligne les coudes légèrement en dessous des épaules.
3
Pousse les poignées vers l''avant jusqu''à extension contrôlée des bras sans verrouiller les coudes.
4
Marque une pause en contraction maximale des pectoraux.
5
Ramène les poignées lentement vers la position de départ en contrôlant la résistance.'),

  ('Chest press convergente', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules antérieures'], 'machine convergente', 'debutant',
  '1
Assieds-toi sur la machine convergente, dos collé au dossier, pieds stables au sol et poignées au niveau de la poitrine.
2
Saisis les poignées avec les coudes fléchis et légèrement ouverts.
3
Pousse les poignées vers l''avant en suivant une trajectoire convergente naturelle.
4
Marque une contraction en fin de poussée sans verrouiller les articulations.
5
Reviens lentement à la position initiale en contrôlant la charge.'),

  ('Chest fly machine', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'machine pec deck', 'debutant',
  '1
Assieds-toi sur la machine pec deck, dos plaqué contre le dossier, avant-bras posés sur les supports ou poignées.
2
Place les coudes légèrement fléchis à hauteur de poitrine.
3
Rapproche les bras devant toi en effectuant une adduction contrôlée des pectoraux.
4
Marque une pause en contraction maximale au centre.
5
Reviens lentement en ouverture jusqu''à étirement contrôlé des pectoraux.'),

  ('Écarté couché haltères', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'haltères, banc', 'intermediaire',
  '1
Allonge-toi sur un banc plat avec un haltère dans chaque main au-dessus de la poitrine, coudes légèrement fléchis.
2
Garde une légère flexion des coudes fixe et stable tout au long du mouvement.
3
Ouvre les bras latéralement en arc de cercle jusqu''à ressentir un étirement des pectoraux.
4
Marque une pause courte en bas sans forcer l''amplitude.
5
Ramène les haltères au-dessus de la poitrine en contractant les pectoraux.'),

  ('Écarté incliné haltères', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'haltères, banc incliné', 'intermediaire',
  '1
Allonge-toi sur un banc incliné à 30–45° avec haltères en main au-dessus de la poitrine.
2
Garde les coudes légèrement fléchis et fixes.
3
Descends les bras en arc de cercle vers l''extérieur jusqu''à étirement des pectoraux supérieurs.
4
Marque une pause contrôlée sans rebond.
5
Remonte en contractant les pectoraux jusqu''à la position initiale.'),

  ('Écarté décliné haltères', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Triceps'], 'haltères, banc décliné', 'intermediaire',
  '1
Allonge-toi sur un banc décliné avec haltères au-dessus de la poitrine, coudes légèrement fléchis.
2
Maintiens une posture stable avec les omoplates serrées.
3
Ouvre les bras en arc de cercle vers le bas jusqu''à étirement des pectoraux inférieurs.
4
Marque une pause en bas sans relâcher la tension.
5
Ramène les haltères au centre en contrôlant la contraction.'),

  ('Écarté poulie vis-à-vis', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'poulie vis-à-vis', 'intermediaire',
  '1
Place-toi au centre de la poulie vis-à-vis, poignées en main, bras légèrement fléchis et poitrine ouverte.
2
Positionne les poulies légèrement derrière la ligne du buste.
3
Rapproche les mains devant toi en arc de cercle en contractant les pectoraux.
4
Marque une contraction maximale au centre.
5
Reviens lentement en ouverture contrôlée contre la résistance.'),

  ('Écarté poulie basse', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'poulie basse', 'intermediaire',
  '1
Place-toi entre deux poulies basses, poignées en main, bras légèrement fléchis.
2
Démarre avec les câbles en position basse derrière le corps.
3
Remonte les bras en arc de cercle vers l''avant et le haut.
4
Contracte les pectoraux en fin de mouvement.
5
Redescends lentement en contrôlant la tension.'),

  ('Écarté poulie haute', 'force', 'Pectoraux', ARRAY['Épaules antérieures', 'Biceps'], 'poulie haute', 'intermediaire',
  '1
Place-toi entre deux poulies hautes, poignées en main, bras légèrement fléchis.
2
Démarre avec les câbles au-dessus de la tête.
3
Ramène les bras vers le bas en arc de cercle jusqu''à la ligne des hanches.
4
Contracte les pectoraux en fin de mouvement.
5
Remonte lentement en contrôle vers la position initiale.'),

  ('Pullover barre EZ', 'force', 'Pectoraux', ARRAY['Dos', 'Triceps'], 'barre EZ, banc', 'intermediaire',
  '1
Allonge-toi sur un banc avec une barre EZ tenue au-dessus de la poitrine, bras légèrement fléchis.
2
Stabilise les épaules et garde le tronc gainé.
3
Descends la barre derrière la tête en arc de cercle contrôlé.
4
Marque une pause en bas sans perte de tension.
5
Ramène la barre au-dessus de la poitrine en contractant le haut du corps.'),

  ('Pullover poulie', 'force', 'Dos', ARRAY['Pectoraux', 'Triceps'], 'poulie haute', 'intermediaire',
  '1
Place-toi face à une poulie haute, bras tendus légèrement fléchis tenant la barre ou corde.
2
Gaine le tronc et fixe les épaules.
3
Tire la charge en arc de cercle vers les cuisses.
4
Contracte fortement les dorsaux en fin de mouvement.
5
Remonte lentement en contrôle jusqu''à la position initiale.'),

  ('Dips poitrine', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules antérieures'], 'barres parallèles', 'intermediaire',
  '1
Place-toi sur des barres parallèles, bras tendus et corps légèrement penché vers l''avant.
2
Descends lentement en fléchissant les coudes tout en gardant l''inclinaison.
3
Amène la poitrine légèrement vers l''avant en bas du mouvement.
4
Marque une pause courte sans rebond.
5
Pousse pour revenir en position haute en contractant les pectoraux.'),

  ('Dips lestés', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules antérieures'], 'barres parallèles, lest', 'avance',
  '1
Attache un lest et place-toi sur les barres parallèles, bras tendus.
2
Incline légèrement le buste vers l''avant.
3
Descends lentement en contrôlant la flexion des coudes.
4
Marque une pause en bas sans relâcher la tension.
5
Pousse pour revenir en position haute.'),

  ('Dips assistés', 'force', 'Pectoraux', ARRAY['Triceps', 'Épaules antérieures'], 'machine assistée', 'debutant',
  '1
Place-toi sur la machine à dips assistés, mains sur les barres et genoux ou pieds sur le support.
2
Garde le buste légèrement incliné vers l''avant.
3
Descends lentement en contrôlant l''assistance.
4
Marque une pause en bas du mouvement.
5
Pousse pour revenir en position haute avec contrôle.'),

  ('Développé militaire haltères', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'haltères', 'intermediaire',
  '1
Assieds-toi ou reste debout avec haltères au niveau des épaules.
2
Gaine le tronc pour stabiliser la colonne.
3
Pousse les haltères verticalement au-dessus de la tête.
4
Contrôle la position en haut sans verrouillage brutal.
5
Redescends lentement jusqu''au niveau des épaules.'),

  ('Développé Arnold', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'haltères', 'intermediaire',
  '1
Assieds-toi avec haltères devant les épaules, paumes vers toi.
2
Pivote les poignets en poussant les haltères vers le haut.
3
Continue la rotation jusqu''à extension au-dessus de la tête.
4
Marque une pause en contraction.
5
Redescends en inversant la rotation jusqu''à la position initiale.'),

  ('Développé épaules machine', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'machine épaules', 'debutant',
  '1
Assieds-toi sur la machine, dos plaqué contre le dossier et poignées au niveau des épaules.
2
Saisis les poignées avec une prise stable.
3
Pousse verticalement jusqu''à extension contrôlée des bras.
4
Marque une pause en haut.
5
Redescends lentement jusqu''à la position de départ.'),

  ('Push press', 'force', 'Épaules', ARRAY['Triceps', 'Quadriceps'], 'barre', 'avance',
  '1
Place la barre sur le haut de la poitrine, pieds largeur épaules.
2
Effectue une légère flexion des genoux pour générer de l''élan.
3
Pousse simultanément jambes et bras pour envoyer la barre au-dessus de la tête.
4
Stabilise la barre bras tendus en haut.
5
Redescends sous contrôle vers la poitrine.'),

  ('Jerk militaire', 'force', 'Épaules', ARRAY['Quadriceps', 'Trapèzes'], 'barre', 'avance',
  '1
Place la barre sur les épaules, posture stable et gainée.
2
Effectue une impulsion explosive avec les jambes.
3
Projette la barre au-dessus de la tête en fente ou split.
4
Stabilise la charge bras tendus.
5
Ramène la barre sous contrôle sur les épaules.'),

  ('Développé nuque', 'force', 'Épaules', ARRAY['Trapèzes', 'Triceps'], 'barre', 'avance',
  '1
Assieds-toi ou reste debout avec la barre derrière la nuque sur les trapèzes.
2
Gaine fortement le tronc.
3
Pousse la barre verticalement au-dessus de la tête.
4
Stabilise en haut sans hyperextension.
5
Redescends lentement derrière la nuque avec contrôle.'),

  ('Développé assis haltères', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'haltères, banc', 'intermediaire',
  '1
Assieds-toi sur un banc avec dossier, haltères au niveau des épaules.
2
Gaine le tronc et garde le dos stable.
3
Pousse les haltères verticalement au-dessus de la tête.
4
Marque une pause en haut du mouvement.
5
Redescends lentement jusqu''à la position initiale.'),

  ('Développé debout haltères', 'force', 'Épaules', ARRAY['Triceps', 'Trapèzes'], 'haltères', 'intermediaire',
  '1
Debout, pieds stables et haltères au niveau des épaules.
2
Gaine fortement le tronc pour éviter les compensations.
3
Pousse les haltères verticalement au-dessus de la tête.
4
Maintiens la position haute avec contrôle.
5
Redescends lentement jusqu''aux épaules.')

) AS v(name, category, muscle_group, muscles, equipment, difficulty, instructions)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = v.name AND e.is_global = true
);

-- ============================================================
-- VÉRIFICATION : liste tous les exercices globaux insérés
-- pour confirmer l'absence de doublons
-- ============================================================
SELECT name, muscle_group, difficulty, is_global
FROM exercises
WHERE is_global = true
  AND name IN (
    'Chest press machine', 'Chest press convergente', 'Chest fly machine',
    'Écarté couché haltères', 'Écarté incliné haltères', 'Écarté décliné haltères',
    'Écarté poulie vis-à-vis', 'Écarté poulie basse', 'Écarté poulie haute',
    'Pullover barre EZ', 'Pullover poulie',
    'Dips poitrine', 'Dips lestés', 'Dips assistés',
    'Développé militaire haltères', 'Développé Arnold', 'Développé épaules machine',
    'Push press', 'Jerk militaire', 'Développé nuque',
    'Développé assis haltères', 'Développé debout haltères'
  )
ORDER BY muscle_group, name;

-- Vérification doublons : si count > 1, il y a un problème
SELECT name, COUNT(*) as nb
FROM exercises
WHERE is_global = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;
