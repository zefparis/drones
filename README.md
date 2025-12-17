# Celestial Integrity Demo

Démonstrateur interactif du système de validation d'intégrité GNSS par consensus multi-capteurs céleste.

[![Live Demo](https://img.shields.io/badge/Demo-drones--omega.vercel.app-blue)](https://drones-omega.vercel.app)
[![Patents](https://img.shields.io/badge/Brevets-FR2514274%20%7C%20FR2514546-green)](https://www.inpi.fr)

---

## Fonctionnalités

### Capteurs implémentés

| Capteur | Status | Description |
|---------|--------|-------------|
| ☀️ **Soleil** | ✅ | Position solaire via `astronomy-engine` |
| ⭐ **Étoiles** | ✅ | Catalogue de 10 étoiles brillantes (Sirius, Vega, Arcturus...) |
| 🧭 **Magnétomètre** | ✅ | Modèle IGRF-13 simplifié |
| 📐 **IMU** | ❌ | Non implémenté |
| 🌡️ **Baromètre** | ❌ | Non implémenté |
| 📸 **Caméra** | ❌ | Non implémenté |

### Scénarios de test

| Scénario | Intégrité attendue | Description |
|----------|-------------------|-------------|
| ✅ **Nominal** | 100% | Position et observation alignées |
| ⚠️ **Dérive 100m** | 85-95% | Décalage GPS de 100m Nord |
| 🚨 **Spoofing GPS** | <60% | Attaque avec décalage de 2.2km |
| 🧭 **Multi-capteurs (jour)** | >95% | Soleil + magnétomètre |
| 🌙 **Nuit (étoiles)** | >90% | 3 étoiles + magnétomètre |
| 🛰️ **Consensus** | >95% | 5 étoiles + magnétomètre |

### Métriques affichées

- **Score d'intégrité** - Pourcentage de consensus
- **Delta angulaire** - Écart azimut/élévation en degrés
- **Distance de Hamming** - Différence bit à bit des signatures
- **Signatures HMAC-SHA3-512** - Attendue vs observée (copiables)
- **Historique** - Graphique des 60 dernières validations
- **Timings** - Temps de prédiction, crypto, total (ms)

### Interface

- 🌐 **Bilingue** - Français / Anglais
- 🌙 **Thème** - Clair / Sombre
- 📊 **Visualisation** - Dôme céleste avec azimut, élévation, points cardinaux
- 📱 **Responsive** - Adapté desktop

---

## Architecture

```
src/
├── components/
│   ├── Header.tsx           # Barre de navigation, langue, thème
│   ├── SimulationPanel.tsx  # Entrées navigation + capteurs
│   ├── VisualizationPanel.tsx # Dôme céleste SVG
│   ├── MetricsPanel.tsx     # Résultats + historique
│   └── theme-provider.tsx   # Contexte thème dark/light
├── lib/
│   ├── celestialValidator.ts # Validateur multi-capteurs
│   ├── ephemeris.ts         # Calcul position solaire
│   ├── stars.ts             # Catalogue étoiles + calcul position
│   ├── magnetometer.ts      # Modèle champ magnétique
│   └── crypto.ts            # HMAC-SHA3-512, Hamming distance
├── types/
│   └── celestial.ts         # Types TypeScript
└── i18n/
    ├── fr.json              # Traductions françaises
    ├── en.json              # Traductions anglaises
    └── i18n.ts              # Configuration i18next
```

---

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Ouvre http://localhost:5173

## Build

```bash
npm run build
```

---

## Stack technique

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Styling** | Tailwind CSS v3 |
| **Charts** | Recharts |
| **Astronomie** | astronomy-engine |
| **Crypto** | @noble/hashes (SHA3-512) |
| **i18n** | react-i18next |
| **Icons** | Lucide React |

---

## Améliorations possibles

### Capteurs à ajouter

- [ ] **IMU** - Accéléromètre/gyroscope pour dead reckoning
- [ ] **Baromètre** - Validation altitude
- [ ] **Caméra** - Visual odometry / horizon detection
- [ ] **Modèle IGRF complet** - Coefficients réels au lieu du modèle simplifié

### Fonctionnalités

- [ ] **Export/Import scénarios** - Sauvegarder configurations en JSON
- [ ] **Mode temps réel** - Simulation continue avec mise à jour automatique
- [ ] **Visualisation 3D** - Globe WebGL avec trajectoire
- [ ] **API REST** - Endpoint pour intégration externe
- [ ] **PWA** - Support offline + installation
- [ ] **Catalogue étoiles étendu** - 50+ étoiles au lieu de 10
- [ ] **Conditions météo** - Impact couverture nuageuse sur confiance
- [ ] **Mode mobile** - Interface tactile optimisée
- [ ] **Tests unitaires** - Vitest pour les fonctions de validation
- [ ] **Documentation API** - TypeDoc pour les types et fonctions

### Architecture

- [ ] **State management** - Zustand ou Jotai pour état global
- [ ] **Validation schemas** - Zod pour validation des entrées
- [ ] **Error boundaries** - Gestion erreurs React
- [ ] **Performance** - Web Workers pour calculs lourds

---

## Brevets

- **FR2514274** - Méthode de validation d'intégrité céleste
- **FR2514546** - Consensus cryptographique multi-capteurs

---

## Licence

Propriétaire - IA-SOLUTION 2025

---

## Contact

**IA-SOLUTION**  
📧 contact@ia-solution.com  
🌐 https://ia-solution.fr
