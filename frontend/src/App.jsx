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

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (account) {
      console.log('👤 Compte connecté:', account);
      checkOwnerStatus();
      // Commenté temporairement pour éviter les erreurs
      // getCurrentPhase();
    }
  }, [account]);

  const initializeApp = async () => {
    try {
      if (web3Service.isMetaMaskAvailable()) {
        const isConnected = await web3Service.isConnected();
        if (isConnected) {
          const currentAccount = await web3Service.getCurrentAccount();
          if (currentAccount) {
            setAccount(currentAccount);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      setError('Erreur lors de l\'initialisation de l\'application');
    }
  };

  const checkOwnerStatus = async () => {
    try {
      // Vérifier d'abord si nous avons un compte
      if (!account) return;
      
      // Temporaire : forcer votre adresse comme propriétaire pour les tests
      const TEMP_OWNER = "0x468950fbea0CC70ad84Ea94723AdecD6103ae568";
      
      if (account.toLowerCase() === TEMP_OWNER.toLowerCase()) {
        console.log('✅ Propriétaire reconnu:', account);
        setIsOwner(true);
        return;
      }
      
      // Essayer la version normale (avec gestion d'erreur)
      try {
        const owner = await contractService.getOwner();
        console.log('🔍 Propriétaire du contrat:', owner);
        console.log('👤 Compte actuel:', account);
        setIsOwner(account.toLowerCase() === owner.toLowerCase());
      } catch (contractError) {
        console.warn('⚠️ Impossible de récupérer le propriétaire du contrat:', contractError);
        // En cas d'erreur, utiliser le fallback
        setIsOwner(account.toLowerCase() === TEMP_OWNER.toLowerCase());
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du propriétaire:', error);
      // Fallback silencieux
      setIsOwner(false);
    }
  };

  const getCurrentPhase = async () => {
    try {
      console.log('🔍 Récupération de la phase actuelle...');
      const phase = await contractService.getCurrentPhase();
      console.log('📋 Phase récupérée:', phase);
      setCurrentPhase(phase);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la phase:', error);
      console.log('🔄 Utilisation de la phase par défaut: Registration');
      // Fallback : phase par défaut
      setCurrentPhase('Registration');
    }
  };

  const handleAccountChange = (newAccount) => {
    setAccount(newAccount);
    setError('');
    setSuccess('');
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 5000);
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
            {currentPhase === 'Voting' && (
              <VoteForm
                account={account}
                onSuccess={showSuccess}
                onError={showError}
              />
            )}
          </div>
        );
      case 'results':
        return (
          <Results
            currentPhase={currentPhase}
            onError={showError}
          />
        );
      case 'admin':
        return isOwner ? (
          <AdminPanel
            account={account}
            currentPhase={currentPhase}
            onPhaseChange={setCurrentPhase}
            onSuccess={showSuccess}
            onError={showError}
          />
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
      case 'Registration':
        return 'bg-blue-100 text-blue-800';
      case 'Voting':
        return 'bg-green-100 text-green-800';
      case 'Ended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {success}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {account && (
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('vote')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vote'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Voter
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Résultats
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Administration
              </button>
            )}
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
            <p className="mt-1 text-sm text-gray-500">
              Connectez votre portefeuille MetaMask pour commencer à voter.
            </p>
          </div>
        ) : (
          <div className="fade-in">
            {renderTabContent()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2025 Voting DApp - Application de vote décentralisée
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;