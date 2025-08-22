import React, { useState, useEffect } from 'react';
import WalletConnexion from './Components/WalletConnexion';
import CandidateList from './Components/CandidateList';
import VoteForm from './Components/VoteForm';
import Results from './Components/Results';
import AdminPanel from './Components/AdminPanel';
import web3Service from './Services/web3Service';
import contractService from './Services/contractService';

function App() {
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('Registration');
  const [activeTab, setActiveTab] = useState('vote');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voterInfo, setVoterInfo] = useState(null);

  // Initialisation du service contrat et récupération du compte
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await contractService.ensureInitialized();

        if (web3Service.isMetaMaskAvailable()) {
          const isConnected = await web3Service.isConnected();
          if (isConnected) {
            const currentAccount = await web3Service.getCurrentAccount();
            if (currentAccount) setAccount(currentAccount);
          }
        }

        await updatePhase();
      } catch (err) {
        console.error('Erreur initialisation:', err);
        setError('Erreur lors de l\'initialisation de l\'application');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Mettre à jour le statut du propriétaire, de la phase et du votant lorsque le compte change
  useEffect(() => {
    if (!account) return;

    const fetchOwnerPhaseAndVoter = async () => {
      try {
        const owner = await contractService.getOwner();
        setIsOwner(account.toLowerCase() === owner.toLowerCase());

        await updatePhase();
        await updateVoterInfo();
      } catch (err) {
        console.error('Erreur récupération owner, phase ou votant:', err);
        setIsOwner(false);
        setVoterInfo(null);
      }
    };

    fetchOwnerPhaseAndVoter();
  }, [account]);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!account) return;
    
    const interval = setInterval(async () => {
      await refreshAll();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [account]);

  const updatePhase = async () => {
    try {
      const phase = await contractService.getCurrentWorkflowStatus();
      setCurrentPhase(phase);
    } catch (err) {
      console.error('Erreur récupération phase:', err);
      setCurrentPhase('Registration');
    }
  };

  const updateVoterInfo = async () => {
    if (!account) return;
    try {
      const info = await contractService.getVoterInfo(account);
      setVoterInfo(info);
    } catch (err) {
      console.error('Erreur récupération info votant:', err);
      setVoterInfo(null);
    }
  };

  // Fonction pour tout actualiser
  const refreshAll = async () => {
    try {
      await updatePhase();
      await updateVoterInfo();
      // Force le re-render des composants enfants
      setActiveTab(current => current);
      setAccount(current => current);
    } catch (error) {
      console.error('Erreur lors du refresh:', error);
    }
  };

  const handleAccountChange = (newAccount) => {
    setAccount(newAccount);
    setError('');
    setSuccess('');
    setVoterInfo(null);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Fonction pour gérer les succès avec refresh automatique
  const showSuccessWithRefresh = async (msg) => {
    showSuccess(msg);
    setTimeout(async () => {
      await refreshAll();
    }, 2000);
  };

  const handleRegisterAsVoter = async () => {
    if (!account || !isOwner) return;
    
    try {
      await contractService.registerVoter(account);
      showSuccess('Vous êtes maintenant enregistré comme votant !');
      
      // Actualiser après 2 secondes
      setTimeout(async () => {
        await updateVoterInfo();
      }, 2000);
    } catch (error) {
      console.error('Erreur auto-enregistrement:', error);
      if (error.message.includes('already registered')) {
        showError('Vous êtes déjà enregistré comme votant');
      } else {
        showError('Erreur lors de l\'enregistrement');
      }
    }
  };

  const VoterRegistrationComponent = () => {
    const [voterAddress, setVoterAddress] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleRegisterVoter = async (e) => {
      e.preventDefault();
      
      if (!voterAddress.trim()) {
        showError('L\'adresse du votant est requise');
        return;
      }

      if (!voterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        showError('Adresse Ethereum invalide');
        return;
      }

      try {
        setIsRegistering(true);
        await contractService.registerVoter(voterAddress.trim());
        setVoterAddress('');
        showSuccess(`Votant ${voterAddress.substring(0, 6)}...${voterAddress.substring(voterAddress.length - 4)} enregistré !`);
        
        // Actualiser TOUTES les données après 2 secondes
        setTimeout(async () => {
          await refreshAll();
        }, 2000);
        
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du votant:', error);
        if (error.message.includes('already registered')) {
          showError('Ce votant est déjà enregistré');
        } else if (error.message.includes('User rejected')) {
          showError('Transaction annulée par l\'utilisateur');
        } else {
          showError('Erreur lors de l\'enregistrement du votant');
        }
      } finally {
        setIsRegistering(false);
      }
    };

    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer des votants</h3>
        
        {/* Bouton d'auto-enregistrement pour l'admin */}
        {isOwner && voterInfo && !voterInfo.isRegistered && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 mb-2">Vous n'êtes pas encore enregistré comme votant.</p>
            <button
              onClick={handleRegisterAsVoter}
              className="btn-primary text-sm"
            >
              M'enregistrer comme votant
            </button>
          </div>
        )}
        
        <form onSubmit={handleRegisterVoter} className="space-y-4">
          <div>
            <label htmlFor="voterAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse du votant *
            </label>
            <input
              type="text"
              id="voterAddress"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              className="input-field"
              placeholder="0x742d35Cc6634C0532925a3b8D000000000000000"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Adresse Ethereum du votant à enregistrer
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!voterAddress.trim() || isRegistering}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRegistering ? (
                <>
                  <div className="spinner"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Enregistrer le votant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vote':
        return (
          <div className="space-y-6">
            <CandidateList 
              currentPhase={currentPhase}
              onError={showError}
            />
            
            {/* Afficher le statut du votant */}
            {voterInfo && (
              <div className={`card ${voterInfo.isRegistered ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${voterInfo.isRegistered ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <p className={`font-medium ${voterInfo.isRegistered ? 'text-green-800' : 'text-yellow-800'}`}>
                      {voterInfo.isRegistered ? 'Votant enregistré' : 'Votant non enregistré'}
                    </p>
                    {voterInfo.isRegistered && voterInfo.hasVoted && (
                      <p className="text-sm text-green-600">Vous avez déjà voté (Candidat #{voterInfo.votedFor})</p>
                    )}
                    {!voterInfo.isRegistered && (
                      <p className="text-sm text-yellow-700">Contactez l'administrateur pour être enregistré</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* VoteForm ne s'affiche que si le votant est enregistré et n'a pas encore voté */}
            {voterInfo && voterInfo.isRegistered && !voterInfo.hasVoted && currentPhase === 'Voting' && (
              <VoteForm
                account={account}
                onSuccess={async (msg) => {
                  showSuccess(msg);
                  setTimeout(async () => {
                    await updateVoterInfo();
                  }, 2000);
                }}
                onError={showError}
              />
            )}
            
            {/* Messages informatifs */}
            {currentPhase !== 'Voting' && (
              <div className="card bg-blue-50 border-blue-200">
                <p className="text-blue-800">
                  {currentPhase === 'Registration' ? 'Le vote n\'a pas encore commencé.' : 'Le vote est terminé.'}
                </p>
              </div>
            )}
            
            {/* Bouton d'actualisation manuelle */}
            <div className="card bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Les données ne sont pas à jour ?</p>
                <button
                  onClick={refreshAll}
                  className="btn-secondary text-sm flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Actualiser</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'results':
        return <Results currentPhase={currentPhase} onError={showError} />;
      case 'admin':
        return isOwner ? (
          <div className="space-y-6">
            <AdminPanel
              account={account}
              currentPhase={currentPhase}
              onPhaseChange={async (newPhase) => {
                setCurrentPhase(newPhase);
                setTimeout(async () => {
                  await refreshAll();
                }, 2000);
              }}
              onSuccess={showSuccessWithRefresh}
              onError={showError}
            />
            <VoterRegistrationComponent />
          </div>
        ) : (
          <div className="card text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Accès refusé</h3>
            <p className="text-gray-600">Vous n'êtes pas autorisé à accéder au panel d'administration.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'Registration': return 'bg-blue-100 text-blue-800';
      case 'Voting': return 'bg-green-100 text-green-800';
      case 'Ended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Voting DApp</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(currentPhase)}`}>
                Phase: {currentPhase}
              </span>
            </div>
            <WalletConnexion 
              account={account}
              onAccountChange={handleAccountChange}
              onError={showError}
            />
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && <div className="max-w-7xl mx-auto px-4 mt-4"><div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div></div>}
      {success && <div className="max-w-7xl mx-auto px-4 mt-4"><div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">{success}</div></div>}

      {/* Navigation */}
      {account && (
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex space-x-8 border-b border-gray-200">
            <button onClick={() => setActiveTab('vote')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'vote' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Voter</button>
            <button onClick={() => setActiveTab('results')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'results' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Résultats</button>
            {isOwner && <button onClick={() => setActiveTab('admin')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Administration</button>}
          </div>
        </nav>
      )}

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!account ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Connectez votre portefeuille</h3>
            <p className="mt-1 text-sm text-gray-500">Connectez votre portefeuille MetaMask pour commencer à voter.</p>
          </div>
        ) : (
          <div className="fade-in">{renderTabContent()}</div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-gray-500">
          © 2025 Voting DApp - Application de vote décentralisée
        </div>
      </footer>
    </div>
  );
}

export default App;