# Voting DApp

Une application décentralisée (DApp) de vote basée sur **Ethereum**.  
Elle est composée de trois parties :
- **Smart Contract** (Solidity, déployé avec Hardhat)
- **Backend** (Node.js + Express, pour servir les données et interagir avec le contrat)
- **Frontend** (React.js + Vite, interface utilisateur)

---

## Fonctionnalités
- Ajout de candidats par l’admin
- Gestion des différentes phases : enregistrement, vote, fin
- Vote unique par utilisateur
- Affichage en temps réel du nombre de votes et des pourcentages
- API backend pour centraliser les appels au smart contract
- Déploiement local avec **Hardhat** (Ethereum local node)

---

## ⚙️ Installation & Utilisation

### 1. Cloner le projet
```bash
git clone git@github.com:Redwane-stdy/VotingDapp.git
```

### 2. Installer les dépendances globales
```bash
npm install
```

### 3. Lancer un nœud Ethereum local
Dans un terminal séparé :
```bash
npx hardhat node
Cette commande :
Lance un nœud local sur http://127.0.0.1:8545
Crée 20 comptes de test avec 10,000 ETH chacun
Affiche les clés privées
```

### 4. Importer les clés privés sur Metamask

Importer un wallet avec un clé privé puis copier/coller la clé.

### 5. Compiler et déployer le smart contract
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
cd backend
npm start
```

### 6. Lancer le frontend

```bash
npm run start:frontend

ou

cd frontend
npm start
```

Le frontend démarre sur http://localhost:3000

### 7. Utiliser l'appli

Ajouter les votants et les candidats depuis le Wallet Admin.
Lancer la phase de vote.
Se connecter avec les wallet votants pour voter.
Terminer l'election depuis le compte admin.



### Workflow Résumé
npx hardhat node → démarre le réseau local
npx hardhat run scripts/deploy.js --network localhost → déploie le smart contract
npm run start:backend → lance l’API backend
npm run start:frontend → lance l’interface utilisateur

### Technologies utilisées
Solidity (Smart Contracts)
Hardhat (Déploiement et test)
Node.js + Express (Backend API)
React.js + Vite + TailwindCSS (Frontend)
Ethers.js / Web3.js (Interaction blockchain)