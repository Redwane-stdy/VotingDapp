import React, { useState, useEffect } from 'react';
import contractService from '../Services/contractService';

const Results = ({ currentPhase, onError }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    loadResults();
  }, [currentPhase]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const candidates = await contractService.getCandidates();
      
      // Trier par nombre de votes (décroissant)
      const sortedResults = candidates.sort((a, b) => parseInt(b.voteCount) - parseInt(a.voteCount));
      
      // Calculer le total des votes
      const total = sortedResults.reduce((sum, candidate) => sum + parseInt(candidate.voteCount), 0);
      setTotalVotes(total);
      
      // Déterminer le gagnant (celui avec le plus de votes)
      if (sortedResults.length > 0 && parseInt(sortedResults[0].voteCount) > 0) {
        setWinner(sortedResults[0]);
      }
      
      setResults(sortedResults);
    } catch (error) {
      console.error('Erreur lors du chargement des résultats:', error);
      onError('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  };

  const getVotePercentage = (voteCount) => {
    if (totalVotes === 0) return 0;
    return ((parseInt(voteCount) / totalVotes) * 100).toFixed(1);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 font-bold">🥇</span>
          </div>
        );
      case 1:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-bold">🥈</span>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold">🥉</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">#{index + 1}</span>
          </div>
        );
    }
  };

  const getProgressBarColor = (index, percentage) => {
    if (index === 0 && percentage > 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-400';
    if (index === 2) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner mr-3"></div>
          <span className="text-gray-600">Chargement des résultats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des résultats */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Résultats de l'élection</h2>
          <button
            onClick={loadResults}
            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Actualiser</span>
          </button>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
            <div className="text-sm text-blue-800">Votes totaux</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{results.length}</div>
            <div className="text-sm text-green-800">Candidats</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-purple-600">
              {currentPhase === 'Ended' ? 'Terminé' : 'En cours'}
            </div>
            <div className="text-sm text-purple-800">Statut</div>
          </div>
        </div>

        {/* Annonce du gagnant */}
        {winner && currentPhase === 'Ended' && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-800">Gagnant de l'élection</h3>
                <p className="text-yellow-700">
                  <span className="font-semibold">{winner.name}</span> avec {winner.voteCount} votes 
                  ({getVotePercentage(winner.voteCount)}%)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des résultats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classement détaillé</h3>
        
        {results.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h4>
            <p className="text-gray-600">Aucun vote n'a encore été enregistré.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((candidate, index) => (
              <div key={index} className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                index === 0 && parseInt(candidate.voteCount) > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-4">
                  {getRankIcon(index)}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{candidate.name}</h4>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">{candidate.voteCount}</div>
                        <div className="text-sm text-gray-500">vote{parseInt(candidate.voteCount) > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    
                    {candidate.description && (
                      <p className="text-sm text-gray-600 mb-3">{candidate.description}</p>
                    )}
                    
                    {/* Barre de progression */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Pourcentage des votes</span>
                        <span className="font-medium">{getVotePercentage(candidate.voteCount)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${getProgressBarColor(index, getVotePercentage(candidate.voteCount))}`}
                          style={{ 
                            width: `${getVotePercentage(candidate.voteCount)}%`,
                            minWidth: parseInt(candidate.voteCount) > 0 ? '8px' : '0px'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Position: {index + 1}</span>
                      <span>ID: {candidate.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {results.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              {currentPhase === 'Ended' 
                ? 'Election terminée - Résultats finaux' 
                : 'Election en cours - Résultats en temps réel'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;