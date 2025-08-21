import React, { useState, useEffect } from 'react';
import web3Service from '../Services/web3Service';

const WalletConnexion = ({ account, onAccountChange, onError }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    if (account) {
      getBalance();
    }
  }, [account]);

  useEffect(() => {
    // Écouter les changements de compte
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      onAccountChange(null);
    } else {
      onAccountChange(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const getBalance = async () => {
    try {
      if (account) {
        const bal = await web3Service.getBalance(account);
        setBalance(parseFloat(bal).toFixed(4));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du solde:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      if (!web3Service.isMetaMaskAvailable()) {
        onError('MetaMask n\'est pas installé. Veuillez installer MetaMask pour continuer.');
        return;
      }

      const result = await web3Service.connectWallet();
      
      if (result && result.account) {
        onAccountChange(result.account);
      } else {
        onError('Aucun compte trouvé. Veuillez débloquer MetaMask.');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error.code === 4001) {
        onError('Connexion refusée par l\'utilisateur.');
      } else {
        onError('Erreur lors de la connexion au portefeuille.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onAccountChange(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!account) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="btn-primary flex items-center space-x-2"
        >
          {isConnecting ? (
            <>
              <div className="spinner"></div>
              <span>Connexion...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Connecter le portefeuille</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="bg-gray-100 rounded-lg px-3 py-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(account)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {balance} ETH
          </div>
        </div>
      </div>
      
      <div className="relative group">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <button
            onClick={getBalance}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualiser le solde</span>
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            onClick={disconnectWallet}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletConnexion;