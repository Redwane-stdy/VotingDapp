import React, { useState, useEffect } from 'react';
import contractService from '../Services/contractService';

const CandidateList = ({ currentPhase, onError }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    loadCandidates();
  }, [currentPhase]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const candidatesData = await contractService.getAllCandidates();
      
      // Calculer le total des votes
      const total = candidatesData.reduce((sum, candidate) => sum + parseInt(candidate.voteCount), 0);
      setTotalVotes(total);
      
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error);
      onError('Erreur lors du chargement des candidats');
    } finally {
      setLoading(false);
    }
  };

  const getVotePercentage = (voteCount) => {
    if (totalVotes === 0) return 0;
    return ((parseInt(voteCount) / totalVotes) * 100).toFixed(1);
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 50) return 'bg-green-500';
    if (percentage >= 30) return 'bg-blue-500';
    if (percentage >= 10) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3"></div>
          <span className="text-gray-600">Chargement des candidats...</span>
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
          <p className="text-gray-600">Aucun candidat n'a encore été enregistré pour cette élection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Liste des candidats</h2>
        <button
          onClick={loadCandidates}
          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Actualiser</span>
        </button>
      </div>

      {totalVotes > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Total des votes</span>
            <span className="text-lg font-bold text-blue-600">{totalVotes}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {candidates.map((candidate, index) => {
          const percentage = getVotePercentage(candidate.voteCount);
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-500">ID: {candidate.id}</p>
                    </div>
                  </div>

                  {candidate.description && (
                    <p className="text-gray-600 mb-3 text-sm">{candidate.description}</p>
                  )}

                  {/* Barre de progression des votes */}
                  {(currentPhase === 'Voting' || currentPhase === 'Ended') && totalVotes > 0 && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                        <div
                          className={`h-3 rounded-full ${getProgressBarColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{candidate.voteCount} votes</span>
                        <span>{percentage}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateList;
