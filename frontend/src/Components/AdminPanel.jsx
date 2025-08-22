import React, { useState, useEffect } from 'react';
import contractService from '../Services/contractService';

const AdminPanel = ({ account, currentPhase, onPhaseChange, onSuccess, onError }) => {
  const [candidateName, setCandidateName] = useState('');
  const [candidateDescription, setCandidateDescription] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isChangingPhase, setIsChangingPhase] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [newVoter, setNewVoter] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalVotes: 0,
    contractOwner: ''
  });

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [cands, owner, regVoters] = await Promise.all([
        contractService.getAllCandidates(),
        contractService.getOwner(),
        contractService.getAllVoters()
      ]);

      const totalVotes = cands.reduce((sum, c) => sum + parseInt(c.voteCount || '0', 10), 0);

      setCandidates(cands);
      setVoters(regVoters);
      setStats({
        totalCandidates: cands.length,
        totalVotes,
        contractOwner: owner || ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
      onError && onError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // CANDIDATES
  // -----------------------------
  const handleAddCandidate = async (e) => {
    e.preventDefault();

    if (!candidateName.trim()) {
      onError && onError('Le nom du candidat est requis');
      return;
    }
    if (currentPhase !== 'Registration') {
      onError && onError("Les candidats ne peuvent être ajoutés que pendant la phase d'enregistrement");
      return;
    }

    try {
      setIsAddingCandidate(true);
      await contractService.addCandidate(candidateName.trim(), candidateDescription.trim());
      setCandidateName('');
      setCandidateDescription('');
      await loadAdminData();
      onSuccess && onSuccess(`Candidat "${candidateName}" ajouté avec succès !`);
    } catch (error) {
      console.error("Erreur lors de l'ajout du candidat:", error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('registration phase ended') || msg.includes('active voting')) {
        onError && onError("La phase d'enregistrement est terminée");
      } else if (msg.includes('user rejected')) {
        onError && onError("Transaction annulée par l'utilisateur");
      } else {
        onError && onError("Erreur lors de l'ajout du candidat");
      }
    } finally {
      setIsAddingCandidate(false);
    }
  };

  // -----------------------------
  // VOTERS
  // -----------------------------
  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    if (!newVoter.trim()) {
      onError && onError("Adresse du votant requise");
      return;
    }
    try {
      await contractService.registerVoter(newVoter.trim());
      onSuccess && onSuccess(`Votant ${newVoter} enregistré !`);
      setNewVoter('');
      await loadAdminData();
    } catch (error) {
      onError && onError(error.message || 'Erreur enregistrement votant');
    }
  };

  // -----------------------------
  // PHASES
  // -----------------------------
  const handlePhaseChange = async (newPhase) => {
    if (newPhase === currentPhase) {
      onError && onError('Cette phase est déjà active');
      return;
    }

    try {
      setIsChangingPhase(true);

      if (newPhase === 'Voting') {
        if (candidates.length === 0) {
          onError && onError('Impossible de commencer le vote sans candidats');
          return;
        }
        await contractService.startVoting();
        onSuccess && onSuccess('Phase de vote commencée !');
      } else if (newPhase === 'Ended') {
        await contractService.endVoting();
        onSuccess && onSuccess('Élection terminée !');
      }

      onPhaseChange && onPhaseChange(newPhase);
      await loadAdminData();
    } catch (error) {
      console.error('Erreur lors du changement de phase:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('user rejected')) {
        onError && onError("Transaction annulée par l'utilisateur");
      } else if (msg.includes('already') && msg.includes('voting')) {
        onError && onError('Le vote a déjà commencé');
      } else if (msg.includes('not started')) {
        onError && onError("Le vote n'a pas encore commencé");
      } else {
        onError && onError('Erreur lors du changement de phase');
      }
    } finally {
      setIsChangingPhase(false);
    }
  };

  const getPhaseActions = () => {
    switch (currentPhase) {
      case 'Registration':
        return [
          {
            label: 'Commencer le vote',
            action: () => handlePhaseChange('Voting'),
            color: 'btn-success',
            disabled: candidates.length === 0,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        ];
      case 'Voting':
        return [
          {
            label: "Terminer l'élection",
            action: () => handlePhaseChange('Ended'),
            color: 'btn-danger',
            disabled: false,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h1.01M15 10h1.01M9.5 15.25a3.5 3.5 0 005 0" />
              </svg>
            )
          }
        ];
      case 'Ended':
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3"></div>
          <span className="text-gray-600">Chargement du panel d'administration...</span>
        </div>
      </div>
    );
  }

  const owner = stats.contractOwner || '';
  const ownerShort =
    owner && owner.length > 10
      ? `${owner.substring(0, 6)}...${owner.substring(owner.length - 4)}`
      : owner;

  return (
    <div className="space-y-6">
      {/* En-tête d'administration */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Panel d'administration</h2>
          <div className="text-sm text-gray-500">Propriétaire: {ownerShort || '—'}</div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCandidates}</div>
            <div className="text-sm text-blue-800">Candidats</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalVotes}</div>
            <div className="text-sm text-green-800">Votes totaux</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-600">{currentPhase}</div>
            <div className="text-sm text-purple-800">Phase actuelle</div>
          </div>
        </div>

        {/* Actions de phase */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Gestion des phases</h3>
          <div className="flex flex-wrap gap-3">
            {getPhaseActions().map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled || isChangingPhase}
                className={`${action.color} disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
              >
                {isChangingPhase ? (
                  <div className="spinner"></div>
                ) : (
                  action.icon
                )}
                <span>{action.label}</span>
              </button>
            ))}

            <button
              onClick={loadAdminData}
              className="btn-secondary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ajout de candidat */}
      {currentPhase === 'Registration' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un candidat</h3>

          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du candidat *
              </label>
              <input
                type="text"
                id="candidateName"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="input-field"
                placeholder="Entrez le nom du candidat"
                required
              />
            </div>

            <div>
              <label htmlFor="candidateDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnel)
              </label>
              <textarea
                id="candidateDescription"
                value={candidateDescription}
                onChange={(e) => setCandidateDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Description du candidat, ses propositions..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!candidateName.trim() || isAddingCandidate}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAddingCandidate ? (
                  <>
                    <div className="spinner"></div>
                    <span>Ajout en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Ajouter le candidat</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enregistrement des votants */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer un votant</h3>
        <form onSubmit={handleRegisterVoter} className="flex gap-3 items-center">
          <input
            type="text"
            value={newVoter}
            onChange={(e) => setNewVoter(e.target.value)}
            placeholder="Adresse du votant (0x...)"
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">Enregistrer</button>
        </form>

        <h4 className="text-md font-medium text-gray-900 mt-6 mb-2">Votants enregistrés</h4>
        {voters.length === 0 ? (
          <p className="text-gray-600">Aucun votant enregistré.</p>
        ) : (
          <ul className="list-disc ml-5">
            {voters.map((v, i) => (
              <li key={i} className="text-sm font-mono">{v.address || v}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Liste des candidats (admin) */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidats enregistrés</h3>

        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun candidat</h4>
            <p className="text-gray-600">
              {currentPhase === 'Registration'
                ? "Commencez par ajouter des candidats à l'élection."
                : "Aucun candidat n'a été enregistré pour cette élection."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">#{candidate.id}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{candidate.name}</h4>
                        <div className="text-sm text-gray-500">
                          {candidate.voteCount} vote{parseInt(candidate.voteCount, 10) > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {candidate.description && (
                      <p className="text-gray-600 text-sm">{candidate.description}</p>
                    )}
                  </div>

                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900">{candidate.voteCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations de phase */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations sur les phases</h3>

        <div className="space-y-4">
          <div
            className={`p-4 rounded-lg border-l-4 ${
              currentPhase === 'Registration'
                ? 'bg-blue-50 border-blue-400'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <h4 className="font-medium text-gray-900">Phase d'enregistrement</h4>
            <p className="text-sm text-gray-600 mt-1">
              Ajout des candidats à l'élection. Seul le propriétaire du contrat peut ajouter des candidats.
            </p>
            {currentPhase === 'Registration' && (
              <div className="text-sm font-medium text-blue-600 mt-2">Phase actuelle</div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border-l-4 ${
              currentPhase === 'Voting'
                ? 'bg-green-50 border-green-400'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <h4 className="font-medium text-gray-900">Phase de vote</h4>
            <p className="text-sm text-gray-600 mt-1">
              Les utilisateurs peuvent voter pour leur candidat préféré. Chaque adresse ne peut voter qu'une seule fois.
            </p>
            {currentPhase === 'Voting' && (
              <div className="text-sm font-medium text-green-600 mt-2">Phase actuelle</div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border-l-4 ${
              currentPhase === 'Ended'
                ? 'bg-red-50 border-red-400'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <h4 className="font-medium text-gray-900">Élection terminée</h4>
            <p className="text-sm text-gray-600 mt-1">
              L'élection est terminée. Les résultats finaux sont disponibles et ne peuvent plus être modifiés.
            </p>
            {currentPhase === 'Ended' && (
              <div className="text-sm font-medium text-red-600 mt-2">Phase actuelle</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
