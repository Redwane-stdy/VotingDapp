import React, { useState, useEffect } from 'react';
import contractService from '../Services/contractService';

const VoteForm = ({ account, onSuccess, onError }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cands, voter] = await Promise.all([
        contractService.getAllCandidates(),
        account ? contractService.getVoterInfo(account) : Promise.resolve({ isRegistered: false, hasVoted: false })
      ]);
      setCandidates(cands);
      setIsRegistered(Boolean(voter.isRegistered));
      setHasVoted(Boolean(voter.hasVoted));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      onError && onError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();

    if (!selectedCandidate) return onError && onError('Veuillez sélectionner un candidat');
    if (hasVoted) return onError && onError('Vous avez déjà voté');
    if (!isRegistered) return onError && onError("Vous devez être enregistré pour voter");

    try {
      setIsVoting(true);
      const candidateId = parseInt(selectedCandidate);
      await contractService.vote(candidateId);
      setHasVoted(true);
      onSuccess && onSuccess('Vote enregistré avec succès !');
      setSelectedCandidate('');
    } catch (error) {
      console.error('Erreur lors du vote:', error);
      const msg = error?.message || 'Erreur lors de l’enregistrement du vote';
      onError && onError(msg);
      if (msg.toLowerCase().includes('already voted')) setHasVoted(true);
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3"></div>
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Non enregistré</h3>
          <p className="text-gray-600">Votre adresse n’est pas enregistrée. Contactez l’administrateur.</p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Vote enregistré</h3>
          <p className="text-gray-600">Votre vote a été enregistré avec succès sur la blockchain.</p>
          <p className="text-sm text-gray-500 mt-2">Vous ne pouvez voter qu'une seule fois par élection.</p>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="card text-center">
        <div className="py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun candidat</h3>
          <p className="text-gray-600">Il n'y a actuellement aucun candidat pour voter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Voter pour un candidat</h2>

      <form onSubmit={handleVote} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Sélectionnez votre candidat :
          </label>

          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="relative">
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="candidate"
                    value={candidate.id}
                    checked={selectedCandidate === candidate.id.toString()}
                    onChange={(e) => setSelectedCandidate(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-lg font-medium text-gray-900">{candidate.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: {candidate.id}</span>
                    </div>
                    {candidate.description && (
                      <p className="text-sm text-gray-600">{candidate.description}</p>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Important</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Une fois votre vote enregistré sur la blockchain, il ne peut pas être modifié.
                Assurez-vous de votre choix avant de confirmer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={loadData}
            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Actualiser</span>
          </button>

          <button
            type="submit"
            disabled={!selectedCandidate || isVoting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isVoting ? (
              <>
                <div className="spinner"></div>
                <span>Vote en cours...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Confirmer le vote</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VoteForm;
