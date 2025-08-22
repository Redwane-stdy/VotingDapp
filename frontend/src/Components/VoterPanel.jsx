import React, { useState, useEffect } from 'react';
import contractService from '../Services/contractService';

const VoterPanel = ({ onError, onSuccess }) => {
  const [account, setAccount] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    connectWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('Metamask non détecté');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const acc = accounts[0];
      setAccount(acc);
      await loadData(acc);
    } catch (error) {
      console.error(error);
      onError && onError(error.message);
    }
  };

  const loadData = async (acc) => {
    try {
      setLoading(true);
      const [candList, voter] = await Promise.all([
        contractService.getAllCandidates(),
        contractService.getVoterInfo(acc),
      ]);
      setCandidates(candList);
      setVoterInfo({
        isRegistered: voter.isRegistered,
        hasVoted: voter.hasVoted,
        votedFor: voter.votedFor
      });
    } catch (error) {
      console.error(error);
      onError && onError('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId) => {
    if (!voterInfo || !voterInfo.isRegistered) {
      onError && onError('Vous n\'êtes pas un votant enregistré');
      return;
    }
    if (voterInfo.hasVoted) {
      onError && onError('Vous avez déjà voté');
      return;
    }

    try {
      setIsVoting(true);
      await contractService.vote(candidateId);
      onSuccess && onSuccess('Vote enregistré avec succès !');
      await loadData(account);
    } catch (error) {
      console.error(error);
      onError && onError(error.message || 'Erreur lors du vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (loading) {
    return <div className="card p-4">Chargement des candidats...</div>;
  }

  if (!voterInfo?.isRegistered) {
    return <div className="card p-4 text-red-600">Adresse non enregistrée pour voter.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-4">Bonjour {account.substring(0,6)}...{account.substring(account.length-4)}</h2>

        {voterInfo.hasVoted ? (
          <div className="text-green-600 font-medium">
            Vous avez déjà voté pour le candidat #{voterInfo.votedFor}.
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium mb-3">Liste des candidats</h3>
            <ul className="space-y-3">
              {candidates.map((c) => (
                <li key={c.id} className="border p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{c.name}</span> - {c.description || 'Pas de description'}
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleVote(c.id)}
                    disabled={isVoting}
                  >
                    {isVoting ? 'Vote en cours...' : 'Voter'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default VoterPanel;
