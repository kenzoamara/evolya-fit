-- ── Seed : 111 plans nutrition globaux ───────────────────────────────────────
-- À exécuter APRÈS library_templates_migration.sql
-- Tous les plans sont is_global = true (coach_id = NULL)
-- Catégorie : 'repas' (repas complets protéine + glucide + légume)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO nutrition_items (coach_id, name, category, description, calories_total, calories_breakdown, objectif, is_global)
VALUES

-- ── LOT 1 ─────────────────────────────────────────────────────────────────────

(NULL, 'Poulet grillé + riz basmati + brocoli',            'repas', '', 520,  '{"poulet grillé":220,"riz basmati":250,"brocoli":50}',             'prise de masse',  true),
(NULL, 'Saumon + patate douce + haricots verts',            'repas', '', 610,  '{"saumon":320,"patate douce":220,"haricots verts":70}',             'prise de masse',  true),
(NULL, 'Omelette (3 œufs) + épinards + pain complet',       'repas', '', 480,  '{"oeufs":210,"epinards":30,"pain complet":240}',                   'maintien',        true),
(NULL, 'Dinde + quinoa + courgettes',                        'repas', '', 530,  '{"dinde":230,"quinoa":250,"courgettes":50}',                       'prise de masse',  true),
(NULL, 'Thon nature + riz complet + salade',                 'repas', '', 500,  '{"thon":220,"riz complet":250,"salade":30}',                       'perte de poids',  true),
(NULL, 'Bœuf 5% + pommes de terre + carottes',              'repas', '', 620,  '{"boeuf 5%":300,"pommes de terre":250,"carottes":70}',             'prise de masse',  true),
(NULL, 'Poulet curry léger + riz basmati',                   'repas', '', 560,  '{"poulet":250,"riz basmati":280,"sauce curry légère":30}',         'prise de masse',  true),
(NULL, 'Yaourt grec 0% + flocons d''avoine + myrtilles',    'repas', '', 420,  '{"yaourt grec 0%":120,"flocons d''avoine":250,"myrtilles":50}',    'perte de poids',  true),
(NULL, 'Wrap poulet + crudités + sauce yaourt',              'repas', '', 450,  '{"wrap":200,"poulet":150,"crudités + sauce yaourt":100}',          'perte de poids',  true),
(NULL, 'Cabillaud + quinoa + brocoli',                       'repas', '', 480,  '{"cabillaud":200,"quinoa":230,"brocoli":50}',                      'perte de poids',  true),
(NULL, 'Steak 5% + riz + haricots verts',                    'repas', '', 590,  '{"steak 5%":280,"riz":280,"haricots verts":30}',                   'prise de masse',  true),
(NULL, 'Poulet teriyaki léger + riz + légumes',              'repas', '', 540,  '{"poulet":240,"riz":260,"légumes + sauce teriyaki":40}',           'prise de masse',  true),
(NULL, 'Omelette blancs d''œufs + avoine + banane',         'repas', '', 430,  '{"blancs d''œufs":180,"avoine":200,"banane":50}',                  'perte de poids',  true),
(NULL, 'Saumon + riz complet + courgettes',                  'repas', '', 600,  '{"saumon":300,"riz complet":260,"courgettes":40}',                 'prise de masse',  true),
(NULL, 'Dinde + patate douce + brocoli',                     'repas', '', 520,  '{"dinde":220,"patate douce":250,"brocoli":50}',                    'prise de masse',  true),
(NULL, 'Poulet + lentilles + carottes',                      'repas', '', 560,  '{"poulet":240,"lentilles":280,"carottes":40}',                     'prise de masse',  true),
(NULL, 'Thon + quinoa + salade verte',                       'repas', '', 490,  '{"thon":220,"quinoa":230,"salade verte":40}',                      'perte de poids',  true),
(NULL, 'Bowl poulet + avocat + riz complet',                 'repas', '', 620,  '{"poulet":240,"avocat":200,"riz complet":180}',                    'prise de masse',  true),
(NULL, 'Bœuf maigre + pâtes complètes + sauce tomate',      'repas', '', 650,  '{"boeuf maigre":300,"pâtes complètes":300,"sauce tomate":50}',     'prise de masse',  true),
(NULL, 'Cabillaud + riz + épinards',                         'repas', '', 470,  '{"cabillaud":200,"riz":240,"épinards":30}',                        'perte de poids',  true),
(NULL, 'Poulet + pois chiches + légumes',                    'repas', '', 580,  '{"poulet":240,"pois chiches":280,"légumes":60}',                   'prise de masse',  true),
(NULL, 'Skyr + avoine + fraises',                            'repas', '', 410,  '{"skyr":130,"avoine":230,"fraises":50}',                           'perte de poids',  true),

-- ── LOT 2 ─────────────────────────────────────────────────────────────────────

(NULL, 'Dinde + riz + brocoli',                              'repas', '', 510,  '{"dinde":200,"riz":260,"brocoli":50}',                            'prise de masse',  true),
(NULL, 'Saumon + quinoa + légumes verts',                    'repas', '', 610,  '{"saumon":320,"quinoa":220,"légumes verts":70}',                   'prise de masse',  true),
(NULL, 'Poulet + pommes de terre + courgettes',              'repas', '', 530,  '{"poulet":220,"pommes de terre":260,"courgettes":50}',             'prise de masse',  true),
(NULL, 'Omelette complète + pain complet + légumes',         'repas', '', 520,  '{"omelette complète":220,"pain complet":220,"légumes":80}',        'maintien',        true),
(NULL, 'Thon + riz + maïs + salade',                         'repas', '', 520,  '{"thon":200,"riz":260,"maïs + salade":60}',                        'perte de poids',  true),
(NULL, 'Bœuf 5% + quinoa + légumes grillés',                 'repas', '', 640,  '{"bœuf 5%":280,"quinoa":280,"légumes grillés":80}',                'prise de masse',  true),
(NULL, 'Poulet + pâtes complètes + légumes',                 'repas', '', 610,  '{"poulet":240,"pâtes complètes":300,"légumes":70}',                'prise de masse',  true),
(NULL, 'Cabillaud + patate douce + brocoli',                 'repas', '', 500,  '{"cabillaud":220,"patate douce":230,"brocoli":50}',                'perte de poids',  true),
(NULL, 'Poulet grillé + boulgour + légumes verts',           'repas', '', 540,  '{"poulet grillé":220,"boulgour":270,"légumes verts":50}',          'prise de masse',  true),
(NULL, 'Dinde + riz complet + brocoli',                      'repas', '', 510,  '{"dinde":200,"riz complet":260,"brocoli":50}',                     'prise de masse',  true),
(NULL, 'Saumon + patate douce + épinards',                   'repas', '', 620,  '{"saumon":330,"patate douce":240,"épinards":50}',                  'prise de masse',  true),
(NULL, 'Thon + quinoa + courgettes',                         'repas', '', 490,  '{"thon":200,"quinoa":240,"courgettes":50}',                        'perte de poids',  true),
(NULL, 'Bœuf 5% + riz basmati + haricots verts',             'repas', '', 600,  '{"bœuf 5%":260,"riz basmati":280,"haricots verts":60}',            'prise de masse',  true),
-- Poulet + lentilles + carottes : doublon exact Lot1 — supprimé
(NULL, 'Omelette (2 œufs + blancs) + avoine',               'repas', '', 450,  '{"omelette":220,"avoine":200,"œufs/ blancs":30}',                  'perte de poids',  true),
(NULL, 'Cabillaud + pommes de terre + brocoli',              'repas', '', 480,  '{"cabillaud":200,"pommes de terre":230,"brocoli":50}',             'perte de poids',  true),
(NULL, 'Poulet + quinoa + légumes grillés',                  'repas', '', 520,  '{"poulet":220,"quinoa":250,"légumes grillés":50}',                 'prise de masse',  true),
(NULL, 'Dinde + pâtes complètes + sauce tomate',             'repas', '', 610,  '{"dinde":230,"pâtes complètes":300,"sauce tomate":80}',            'prise de masse',  true),
-- Saumon + riz complet + courgettes : doublon exact Lot1 — supprimé

-- ── LOT 3 ─────────────────────────────────────────────────────────────────────

-- Poulet curry léger + riz basmati : doublon exact Lot1 (calories 550 vs 560) — supprimé
(NULL, 'Thon + riz + salade verte',                          'repas', '', 500,  '{"thon":220,"riz":250,"salade verte":30}',                         'perte de poids',  true),
(NULL, 'Bœuf maigre + patate douce + brocoli',               'repas', '', 630,  '{"bœuf maigre":280,"patate douce":280,"brocoli":70}',              'prise de masse',  true),
(NULL, 'Poulet + pois chiches + légumes verts',              'repas', '', 580,  '{"poulet":240,"pois chiches":280,"légumes verts":60}',             'prise de masse',  true),
(NULL, 'Skyr + flocons d''avoine + banane',                  'repas', '', 430,  '{"skyr":130,"flocons d''avoine":250,"banane":50}',                 'perte de poids',  true),
(NULL, 'Dinde + riz + courgettes',                           'repas', '', 500,  '{"dinde":200,"riz":250,"courgettes":50}',                          'prise de masse',  true),
(NULL, 'Cabillaud + quinoa + épinards',                      'repas', '', 470,  '{"cabillaud":200,"quinoa":220,"épinards":50}',                     'perte de poids',  true),
(NULL, 'Poulet + pommes de terre + carottes',                'repas', '', 530,  '{"poulet":220,"pommes de terre":260,"carottes":50}',               'prise de masse',  true),
(NULL, 'Saumon + boulgour + brocoli',                        'repas', '', 610,  '{"saumon":320,"boulgour":260,"brocoli":30}',                       'prise de masse',  true),
(NULL, 'Omelette + pain complet + salade',                   'repas', '', 520,  '{"omelette":220,"pain complet":220,"salade":80}',                  'maintien',        true),
(NULL, 'Thon + quinoa + maïs + salade',                      'repas', '', 520,  '{"thon":200,"quinoa":260,"maïs + salade":60}',                     'perte de poids',  true),
(NULL, 'Bœuf 5% + pâtes complètes + légumes',               'repas', '', 650,  '{"bœuf 5%":280,"pâtes complètes":300,"légumes":70}',               'prise de masse',  true),
(NULL, 'Poulet + riz + haricots verts',                      'repas', '', 510,  '{"poulet":220,"riz":250,"haricots verts":40}',                     'prise de masse',  true),
(NULL, 'Dinde + lentilles + carottes',                       'repas', '', 560,  '{"dinde":230,"lentilles":270,"carottes":60}',                      'prise de masse',  true),
(NULL, 'Cabillaud + riz + courgettes',                       'repas', '', 470,  '{"cabillaud":200,"riz":220,"courgettes":50}',                      'perte de poids',  true),
(NULL, 'Poulet + quinoa + brocoli',                          'repas', '', 520,  '{"poulet":220,"quinoa":250,"brocoli":50}',                         'prise de masse',  true),
(NULL, 'Saumon + patate douce + légumes verts',              'repas', '', 620,  '{"saumon":330,"patate douce":240,"légumes verts":50}',             'prise de masse',  true),
(NULL, 'Thon + riz complet + épinards',                      'repas', '', 500,  '{"thon":220,"riz complet":250,"épinards":30}',                     'perte de poids',  true),
(NULL, 'Bœuf maigre + riz + légumes grillés',               'repas', '', 610,  '{"bœuf maigre":260,"riz":280,"légumes grillés":70}',               'prise de masse',  true),
(NULL, 'Poulet + lentilles + courgettes',                    'repas', '', 560,  '{"poulet":230,"lentilles":270,"courgettes":60}',                   'prise de masse',  true),
(NULL, 'Dinde + quinoa + brocoli',                           'repas', '', 530,  '{"dinde":220,"quinoa":260,"brocoli":50}',                          'prise de masse',  true),
(NULL, 'Omelette blancs + avoine + fruits rouges',           'repas', '', 420,  '{"blancs d''œufs":180,"avoine":200,"fruits rouges":40}',           'perte de poids',  true),
(NULL, 'Cabillaud + patate douce + épinards',                'repas', '', 500,  '{"cabillaud":200,"patate douce":250,"épinards":50}',               'perte de poids',  true),
(NULL, 'Poulet + riz basmati + légumes',                     'repas', '', 520,  '{"poulet":220,"riz basmati":270,"légumes":30}',                    'prise de masse',  true),
(NULL, 'Saumon + quinoa + courgettes',                       'repas', '', 600,  '{"saumon":320,"quinoa":250,"courgettes":30}',                      'prise de masse',  true),
(NULL, 'Thon + pommes de terre + salade',                    'repas', '', 490,  '{"thon":200,"pommes de terre":240,"salade":50}',                   'perte de poids',  true);

-- ── LOT 4 — 47 nouveaux plans uniques ────────────────────────────────────────

INSERT INTO nutrition_items (coach_id, name, category, description, calories_total, calories_breakdown, objectif, is_global)
VALUES

(NULL, 'Bœuf 5% + riz complet + brocoli',                   'repas', '', 600,  '{"bœuf 5%":260,"riz complet":280,"brocoli":60}',                   'prise de masse',  true),
(NULL, 'Poulet + pois chiches + carottes',                   'repas', '', 580,  '{"poulet":240,"pois chiches":280,"carottes":60}',                  'prise de masse',  true),
(NULL, 'Dinde + pâtes complètes + légumes',                  'repas', '', 610,  '{"dinde":230,"pâtes complètes":300,"légumes":80}',                 'prise de masse',  true),
(NULL, 'Cabillaud + quinoa + courgettes',                    'repas', '', 480,  '{"cabillaud":200,"quinoa":230,"courgettes":50}',                   'perte de poids',  true),
(NULL, 'Poulet + patate douce + brocoli',                    'repas', '', 530,  '{"poulet":220,"patate douce":260,"brocoli":50}',                   'prise de masse',  true),
(NULL, 'Saumon + riz + épinards',                            'repas', '', 600,  '{"saumon":320,"riz":250,"épinards":30}',                           'prise de masse',  true),
(NULL, 'Thon + quinoa + légumes verts',                      'repas', '', 490,  '{"thon":200,"quinoa":240,"légumes verts":50}',                     'perte de poids',  true),
(NULL, 'Bœuf maigre + pommes de terre + carottes',           'repas', '', 620,  '{"bœuf maigre":280,"pommes de terre":270,"carottes":70}',          'prise de masse',  true),
(NULL, 'Poulet + lentilles + brocoli',                       'repas', '', 560,  '{"poulet":240,"lentilles":270,"brocoli":50}',                      'prise de masse',  true),
(NULL, 'Poulet + riz + salade',                              'repas', '', 510,  '{"poulet":220,"riz":260,"salade":30}',                             'prise de masse',  true),
(NULL, 'Saumon + patate douce + brocoli',                    'repas', '', 620,  '{"saumon":330,"patate douce":240,"brocoli":50}',                   'prise de masse',  true),
(NULL, 'Thon + riz complet + carottes',                      'repas', '', 500,  '{"thon":220,"riz complet":250,"carottes":30}',                     'perte de poids',  true),
(NULL, 'Bœuf 5% + quinoa + légumes',                         'repas', '', 640,  '{"bœuf 5%":280,"quinoa":300,"légumes":60}',                        'prise de masse',  true),
(NULL, 'Poulet + pâtes complètes + brocoli',                 'repas', '', 610,  '{"poulet":240,"pâtes complètes":300,"brocoli":70}',                'prise de masse',  true),
(NULL, 'Dinde + lentilles + courgettes',                     'repas', '', 560,  '{"dinde":230,"lentilles":270,"courgettes":60}',                    'prise de masse',  true),
(NULL, 'Cabillaud + riz + légumes verts',                    'repas', '', 480,  '{"cabillaud":200,"riz":240,"légumes verts":40}',                   'perte de poids',  true),
(NULL, 'Poulet + quinoa + carottes',                         'repas', '', 520,  '{"poulet":220,"quinoa":250,"carottes":50}',                        'prise de masse',  true),
(NULL, 'Thon + patate douce + salade',                       'repas', '', 490,  '{"thon":200,"patate douce":240,"salade":50}',                      'perte de poids',  true),
(NULL, 'Bœuf maigre + riz + brocoli',                        'repas', '', 610,  '{"bœuf maigre":260,"riz":280,"brocoli":70}',                       'prise de masse',  true),
(NULL, 'Poulet + pois chiches + courgettes',                 'repas', '', 580,  '{"poulet":240,"pois chiches":280,"courgettes":60}',                'prise de masse',  true),
(NULL, 'Dinde + quinoa + légumes verts',                     'repas', '', 530,  '{"dinde":220,"quinoa":260,"légumes verts":50}',                    'prise de masse',  true),
(NULL, 'Poulet + riz + épinards',                            'repas', '', 520,  '{"poulet":220,"riz":260,"épinards":40}',                           'prise de masse',  true),
(NULL, 'Saumon + quinoa + légumes grillés',                  'repas', '', 600,  '{"saumon":320,"quinoa":250,"légumes grillés":30}',                 'prise de masse',  true),
(NULL, 'Thon + riz complet + brocoli',                       'repas', '', 500,  '{"thon":220,"riz complet":250,"brocoli":30}',                      'perte de poids',  true),
(NULL, 'Poulet + patate douce + légumes verts',              'repas', '', 530,  '{"poulet":220,"patate douce":260,"légumes verts":50}',             'prise de masse',  true),
(NULL, 'Saumon + riz + brocoli',                             'repas', '', 600,  '{"saumon":320,"riz":250,"brocoli":30}',                            'prise de masse',  true),
(NULL, 'Thon + quinoa + épinards',                           'repas', '', 490,  '{"thon":200,"quinoa":240,"épinards":50}',                          'perte de poids',  true),
(NULL, 'Bœuf maigre + riz + carottes',                       'repas', '', 610,  '{"bœuf maigre":260,"riz":280,"carottes":70}',                      'prise de masse',  true),
(NULL, 'Poulet + pois chiches + brocoli',                    'repas', '', 580,  '{"poulet":240,"pois chiches":280,"brocoli":60}',                   'prise de masse',  true),
(NULL, 'Dinde + lentilles + légumes verts',                  'repas', '', 560,  '{"dinde":230,"lentilles":270,"légumes verts":60}',                 'prise de masse',  true),
(NULL, 'Thon + riz + salade',                                'repas', '', 500,  '{"thon":220,"riz":250,"salade":30}',                               'perte de poids',  true),
(NULL, 'Dinde + riz + légumes verts',                        'repas', '', 500,  '{"dinde":200,"riz":260,"légumes verts":40}',                       'prise de masse',  true),
(NULL, 'Thon + quinoa + carottes',                           'repas', '', 490,  '{"thon":200,"quinoa":240,"carottes":50}',                          'perte de poids',  true),
(NULL, 'Poulet + riz + courgettes',                          'repas', '', 520,  '{"poulet":220,"riz":260,"courgettes":40}',                         'prise de masse',  true),
(NULL, 'Saumon + quinoa + brocoli',                          'repas', '', 610,  '{"saumon":320,"quinoa":260,"brocoli":30}',                         'prise de masse',  true),
(NULL, 'Thon + patate douce + épinards',                     'repas', '', 490,  '{"thon":200,"patate douce":240,"épinards":50}',                    'perte de poids',  true),
(NULL, 'Bœuf 5% + riz + légumes',                            'repas', '', 600,  '{"bœuf 5%":260,"riz":280,"légumes":60}',                           'prise de masse',  true),
(NULL, 'Dinde + pâtes complètes + brocoli',                  'repas', '', 610,  '{"dinde":230,"pâtes complètes":300,"brocoli":80}',                 'prise de masse',  true),
(NULL, 'Cabillaud + quinoa + carottes',                      'repas', '', 480,  '{"cabillaud":200,"quinoa":230,"carottes":50}',                     'perte de poids',  true),
(NULL, 'Thon + quinoa + salade',                             'repas', '', 490,  '{"thon":200,"quinoa":240,"salade":50}',                            'perte de poids',  true),
(NULL, 'Bœuf maigre + riz + courgettes',                     'repas', '', 610,  '{"bœuf maigre":260,"riz":280,"courgettes":70}',                    'prise de masse',  true),
(NULL, 'Bœuf 5% + patate douce + brocoli',                   'repas', '', 630,  '{"bœuf 5%":280,"patate douce":280,"brocoli":70}',                  'prise de masse',  true),
(NULL, 'Poulet + riz + carottes',                            'repas', '', 520,  '{"poulet":220,"riz":260,"carottes":40}',                           'prise de masse',  true),
(NULL, 'Cabillaud + riz + brocoli',                          'repas', '', 480,  '{"cabillaud":200,"riz":240,"brocoli":40}',                         'perte de poids',  true),
(NULL, 'Poulet + lentilles + épinards',                      'repas', '', 560,  '{"poulet":230,"lentilles":270,"épinards":60}',                     'prise de masse',  true),
(NULL, 'Thon + riz + légumes',                               'repas', '', 500,  '{"thon":220,"riz":250,"légumes":30}',                              'perte de poids',  true),
(NULL, 'Bœuf maigre + pâtes complètes + brocoli',            'repas', '', 650,  '{"bœuf maigre":280,"pâtes complètes":300,"brocoli":70}',           'prise de masse',  true);

-- ── LOT 5 — 20 plans prise de masse (huile d'olive, parmesan, avocat…) ──────

INSERT INTO nutrition_items (coach_id, name, category, description, calories_total, calories_breakdown, objectif, is_global)
VALUES
(NULL, 'Poulet + riz basmati + huile d''olive + brocoli',         'repas', '', 720, '{"poulet":260,"riz basmati":320,"huile d''olive":100,"brocoli":40}',            'prise de masse', true),
(NULL, 'Saumon + quinoa + avocat + épinards',                      'repas', '', 780, '{"saumon":340,"quinoa":250,"avocat":150,"épinards":40}',                        'prise de masse', true),
(NULL, 'Bœuf 10% + pâtes complètes + sauce tomate',               'repas', '', 850, '{"bœuf 10%":380,"pâtes complètes":420,"sauce tomate":50}',                       'prise de masse', true),
(NULL, 'Dinde + patate douce + haricots verts + huile d''olive',   'repas', '', 700, '{"dinde":260,"patate douce":260,"haricots verts":60,"huile d''olive":120}',    'prise de masse', true),
(NULL, 'Omelette 4 œufs + pain complet + fromage léger',          'repas', '', 760, '{"œufs":320,"pain complet":240,"fromage léger":200}',                            'prise de masse', true),
(NULL, 'Poulet curry + riz basmati + lait de coco léger',         'repas', '', 820, '{"poulet":260,"riz basmati":380,"lait de coco léger":180}',                       'prise de masse', true),
(NULL, 'Thon + riz complet + maïs + huile d''olive',              'repas', '', 750, '{"thon":300,"riz complet":300,"maïs":80,"huile d''olive":70}',                  'prise de masse', true),
(NULL, 'Cabillaud + quinoa + huile d''olive + légumes',            'repas', '', 680, '{"cabillaud":260,"quinoa":260,"huile d''olive":120,"légumes":40}',              'prise de masse', true),
(NULL, 'Steak 5% + pommes de terre + légumes grillés',            'repas', '', 800, '{"steak 5%":340,"pommes de terre":380,"légumes grillés":80}',                    'prise de masse', true),
(NULL, 'Poulet + lentilles + carottes + huile d''olive',          'repas', '', 780, '{"poulet":300,"lentilles":360,"carottes":60,"huile d''olive":60}',              'prise de masse', true),
(NULL, 'Saumon + riz complet + brocoli + beurre',                 'repas', '', 820, '{"saumon":340,"riz complet":320,"brocoli":60,"beurre":100}',                    'prise de masse', true),
(NULL, 'Dinde + quinoa + courgettes + huile d''olive',            'repas', '', 720, '{"dinde":260,"quinoa":300,"courgettes":40,"huile d''olive":120}',               'prise de masse', true),
(NULL, 'Poulet + pâtes complètes + parmesan',                     'repas', '', 860, '{"poulet":300,"pâtes complètes":450,"parmesan":110}',                             'prise de masse', true),
(NULL, 'Bœuf maigre + riz basmati + légumes',                    'repas', '', 790, '{"bœuf maigre":320,"riz basmati":390,"légumes":80}',                             'prise de masse', true),
(NULL, 'Omelette blancs + avoine + banane + beurre de cacahuète', 'repas', '', 780, '{"blancs d''œufs":200,"avoine":300,"banane":100,"beurre de cacahuète":180}',  'prise de masse', true),
(NULL, 'Thon + patate douce + salade + huile d''olive',          'repas', '', 720, '{"thon":300,"patate douce":300,"salade":40,"huile d''olive":80}',               'prise de masse', true),
(NULL, 'Poulet + quinoa + pois chiches',                          'repas', '', 800, '{"poulet":300,"quinoa":300,"pois chiches":200}',                                  'prise de masse', true),
(NULL, 'Cabillaud + riz + légumes + huile d''olive',              'repas', '', 700, '{"cabillaud":260,"riz":320,"légumes":40,"huile d''olive":80}',                  'prise de masse', true),
(NULL, 'Saumon + pâtes complètes + épinards',                    'repas', '', 860, '{"saumon":360,"pâtes complètes":420,"épinards":80}',                             'prise de masse', true),
(NULL, 'Dinde + riz + brocoli + huile d''olive',                 'repas', '', 740, '{"dinde":260,"riz":360,"brocoli":60,"huile d''olive":60}',                     'prise de masse', true);

-- ── LOT 6 — 30 plans recomposition corporelle ────────────────────────────────

INSERT INTO nutrition_items (coach_id, name, category, description, calories_total, calories_breakdown, objectif, is_global)
VALUES
(NULL, 'Poulet riz brocoli',                         'repas', '', 520,  '{"poulet":220,"riz":260,"brocoli":40}',                                        'recomposition corporelle', true),
(NULL, 'Saumon quinoa légumes',                       'repas', '', 540,  '{"saumon":260,"quinoa":240,"légumes":40}',                                     'recomposition corporelle', true),
(NULL, 'Dinde patate douce haricots verts',           'repas', '', 480,  '{"dinde":200,"patate douce":240,"haricots verts":40}',                         'recomposition corporelle', true),
(NULL, 'Steak 5% riz complet courgettes',             'repas', '', 560,  '{"steak 5%":240,"riz complet":280,"courgettes":40}',                           'recomposition corporelle', true),
(NULL, 'Omelette 3 oeufs avoine fruit',               'repas', '', 510,  '{"oeufs":210,"avoine":220,"fruit":80}',                                        'recomposition corporelle', true),
(NULL, 'Poulet quinoa avocat',                        'repas', '', 530,  '{"poulet":240,"quinoa":200,"avocat":90}',                                      'recomposition corporelle', true),
(NULL, 'Thon riz complet légumes',                    'repas', '', 490,  '{"thon":220,"riz complet":240,"légumes":30}',                                  'recomposition corporelle', true),
(NULL, 'Blanc de poulet pâtes complètes',             'repas', '', 570,  '{"blanc de poulet":240,"pâtes complètes":300,"autres":30}',                   'recomposition corporelle', true),
(NULL, 'Saumon patate douce brocoli',                 'repas', '', 550,  '{"saumon":260,"patate douce":250,"brocoli":40}',                               'recomposition corporelle', true),
(NULL, 'Poulet lentilles carottes',                   'repas', '', 520,  '{"poulet":220,"lentilles":260,"carottes":40}',                                 'recomposition corporelle', true),
(NULL, 'Skyr flocons avoine fruits rouges',           'repas', '', 430,  '{"skyr":150,"flocons d avoine":200,"fruits rouges":80}',                       'recomposition corporelle', true),
(NULL, 'Wrap poulet avocat crudités',                 'repas', '', 500,  '{"poulet":220,"avocat":150,"crudités":130}',                                   'recomposition corporelle', true),
(NULL, 'Oeufs brouillés pain complet avocat',         'repas', '', 520,  '{"oeufs":220,"pain complet":180,"avocat":120}',                                'recomposition corporelle', true),
(NULL, 'Steak dinde riz basmati légumes',             'repas', '', 510,  '{"dinde":200,"riz basmati":260,"légumes":50}',                                 'recomposition corporelle', true),
(NULL, 'Cabillaud quinoa épinards',                   'repas', '', 450,  '{"cabillaud":200,"quinoa":210,"épinards":40}',                                 'recomposition corporelle', true),
(NULL, 'Poulet pois chiches légumes',                 'repas', '', 560,  '{"poulet":240,"pois chiches":280,"légumes":40}',                               'recomposition corporelle', true),
(NULL, 'Yaourt grec avoine banane',                   'repas', '', 480,  '{"yaourt grec":180,"avoine":220,"banane":80}',                                 'recomposition corporelle', true),
(NULL, 'Saumon riz légumes verts',                    'repas', '', 520,  '{"saumon":240,"riz":240,"légumes verts":40}',                                  'recomposition corporelle', true),
(NULL, 'Poulet patate douce salade',                  'repas', '', 500,  '{"poulet":220,"patate douce":240,"salade":40}',                                'recomposition corporelle', true),
(NULL, 'Boeuf maigre quinoa légumes',                 'repas', '', 560,  '{"boeuf maigre":240,"quinoa":240,"légumes":80}',                               'recomposition corporelle', true),
(NULL, 'Omelette blancs oeufs avoine',                'repas', '', 420,  '{"blancs oeufs":160,"avoine":200,"autres":60}',                                'recomposition corporelle', true),
(NULL, 'Poulet pâtes complètes sauce tomate',         'repas', '', 580,  '{"poulet":240,"pâtes complètes":300,"sauce tomate":40}',                       'recomposition corporelle', true),
(NULL, 'Thon avocat riz complet',                     'repas', '', 520,  '{"thon":220,"avocat":140,"riz complet":160}',                                  'recomposition corporelle', true),
(NULL, 'Dinde quinoa brocoli',                        'repas', '', 500,  '{"dinde":220,"quinoa":240,"brocoli":40}',                                      'recomposition corporelle', true),
(NULL, 'Saumon lentilles légumes',                    'repas', '', 560,  '{"saumon":260,"lentilles":260,"légumes":40}',                                  'recomposition corporelle', true),
(NULL, 'Poulet riz légumes huile olive',              'repas', '', 540,  '{"poulet":220,"riz":260,"légumes":40,"huile olive":20}',                       'recomposition corporelle', true),
(NULL, 'Skyr miel avoine amandes',                    'repas', '', 450,  '{"skyr":160,"miel":80,"avoine":150,"amandes":60}',                             'recomposition corporelle', true),
(NULL, 'Boeuf maigre patate douce',                   'repas', '', 530,  '{"boeuf maigre":230,"patate douce":300}',                                      'recomposition corporelle', true),
(NULL, 'Cabillaud riz basmati légumes',               'repas', '', 480,  '{"cabillaud":200,"riz basmati":240,"légumes":40}',                             'recomposition corporelle', true),
(NULL, 'Poulet quinoa avocat légumes',                'repas', '', 550,  '{"poulet":240,"quinoa":200,"avocat":90,"légumes":20}',                         'recomposition corporelle', true);

-- ── Vérification ──────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM nutrition_items WHERE is_global = true;
-- Attendu : 161
