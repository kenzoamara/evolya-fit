'use client'

export function ProgrammePreview() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
      <div className="flex h-[700px]">
        {/* Sidebar gauche */}
        <div className="w-[220px] bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
          <div className="text-xs text-gray-500 font-semibold uppercase mb-4 px-2">Bibliothèque</div>

          <div className="space-y-1">
            <div className="text-xs text-gray-600 font-medium px-3 py-2 rounded cursor-pointer hover:bg-gray-100">
              Tous
            </div>
            <div className="text-xs text-white font-medium px-3 py-2 rounded bg-green-600 cursor-pointer">
              Force
            </div>
            <div className="text-xs text-gray-600 font-medium px-3 py-2 rounded cursor-pointer hover:bg-gray-100">
              Cardio
            </div>
          </div>

          <div className="text-xs text-gray-500 font-semibold uppercase mt-6 mb-3 px-2">Exercices</div>
          <div className="space-y-1 text-xs">
            <div className="px-3 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 rounded">
              <div className="font-medium">Développé Arnold</div>
              <div className="text-gray-500">Epaules</div>
            </div>
            <div className="px-3 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 rounded">
              <div className="font-medium">Développé assis haltères</div>
              <div className="text-gray-500">Epaules</div>
            </div>
            <div className="px-3 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 rounded">
              <div className="font-medium">Développé couché barre</div>
              <div className="text-gray-500">Pectoraux</div>
            </div>
            <div className="px-3 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 rounded">
              <div className="font-medium text-gray-600">Développé couché décli...</div>
              <div className="text-gray-500">Pectoraux</div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col">
          {/* Header du programme */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Prise de masse — Push/Pull/Legs</h2>
                <p className="text-sm text-gray-500 mt-1">3 jours - sportif</p>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
                Assigner
              </button>
            </div>

            {/* Assigné à */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Assigné à :</span> Bastien{' '}
                <span className="text-gray-500">depuis le 2 juin</span>
              </p>
            </div>
          </div>

          {/* Phase et exercices */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Phase */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold">
                    Phase 1-3j
                  </span>
                </div>

                {/* Exercices */}
                <div className="space-y-2">
                  {/* Exercice 1 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Push - Poitrine/Epaules/Triceps</p>
                      <p className="text-xs text-gray-500 mt-1">6 ex</p>
                    </div>
                  </div>

                  {/* Exercice 2 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Développé couché à la barre</p>
                      <p className="text-xs text-gray-500 mt-1">4 × 6 reps · 80 kg</p>
                    </div>
                  </div>

                  {/* Exercice 3 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Développé incliné haltères</p>
                      <p className="text-xs text-gray-500 mt-1">3 × 8 reps · 30 kg</p>
                    </div>
                  </div>

                  {/* Exercice 4 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Dips (poids du corps ou lesté)</p>
                      <p className="text-xs text-gray-500 mt-1">3 × 8 reps · —</p>
                    </div>
                  </div>

                  {/* Exercice 5 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Développé militaire à la barre</p>
                      <p className="text-xs text-gray-500 mt-1">3 × 8 reps · 50 kg</p>
                    </div>
                  </div>

                  {/* Exercice 6 avec checkmark */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Élévations latérales haltères</p>
                      <p className="text-xs text-gray-500 mt-1">3 × 10 reps · 12 kg</p>
                    </div>
                    <div className="text-green-600 ml-2">✓</div>
                  </div>

                  {/* Exercice 7 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Extension triceps à la corde</p>
                      <p className="text-xs text-gray-500 mt-1">3 × 10 reps · 20 kg</p>
                    </div>
                  </div>
                </div>

                {/* Bouton Ajouter */}
                <button className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700">
                  + Ajouter
                </button>
              </div>

              {/* Phase 2 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">
                    Phase 2-3j
                  </span>
                </div>
                <p className="text-sm text-gray-500">6 ex.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
            <button className="text-sm text-gray-600 hover:text-gray-900">Copier</button>
            <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
