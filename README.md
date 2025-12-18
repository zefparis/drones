# CORTEX-U7 - Celestial Integrity Demo

**Plateforme de contrôle avancée pour drones autonomes** avec validation d'intégrité GNSS par consensus multi-capteurs céleste.

[![Live Demo](https://img.shields.io/badge/Demo-drones--omega.vercel.app-blue)](https://drones-omega.vercel.app)
[![Patents](https://img.shields.io/badge/Brevets-FR2514274%20%7C%20FR2514546-green)](https://www.inpi.fr)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

---

## 🎯 Vue d'ensemble

CORTEX-U7 est un système complet de gestion de drone autonome comprenant :

- **730+ paramètres configurables** répartis sur 12 modules
- **Dashboard temps réel** avec visualisation 3D (Three.js)
- **Authentification cognitive HCS-SHIELD** anti-bot et anti-détournement
- **Intégration ROS2** via WebSocket bridge
- **Validation d'intégrité céleste** brevetée (FR2514274, FR2514546)

---

## 📊 Fonctionnalités

### Validation d'Intégrité Céleste

Système de détection de spoofing GPS par triangulation céleste :

| Capteur | Status | Algorithme |
|---------|--------|------------|
| ☀️ **Soleil** | ✅ | Position via `astronomy-engine` (VSOP87) |
| ⭐ **Étoiles** | ✅ | Catalogue 10 étoiles (Sirius, Vega, Arcturus...) |
| 🧭 **Magnétomètre** | ✅ | Modèle IGRF-13 simplifié |
| 📐 **IMU** | ✅ | Accéléromètre/gyroscope configurables |
| 🌡️ **Baromètre** | ✅ | Validation altitude barométrique |
| 📸 **VIO** | ✅ | Visual-Inertial Odometry |

### Scénarios de Test

| Scénario | Intégrité | Description |
|----------|-----------|-------------|
| ✅ **Nominal** | 100% | Position et observation alignées |
| ⚠️ **Dérive 100m** | 85-95% | Décalage GPS de 100m Nord |
| 🚨 **Spoofing GPS** | <60% | Attaque avec décalage de 2.2km |
| 🧭 **Multi-capteurs (jour)** | >95% | Soleil + magnétomètre |
| 🌙 **Nuit (étoiles)** | >90% | 3 étoiles + magnétomètre |
| 🛰️ **Consensus complet** | >95% | 5 étoiles + magnétomètre |

### Métriques Cryptographiques

- **Score d'intégrité** — Pourcentage de consensus multi-capteurs
- **Delta angulaire** — Écart azimut/élévation en degrés
- **Distance de Hamming** — Différence bit à bit des signatures
- **Signatures HMAC-SHA3-512** — Attendue vs observée (copiables)
- **Historique** — Graphique temps réel des 60 dernières validations
- **Timings** — Temps de prédiction, crypto, total (ms)

---

## 🎛️ Centre de Contrôle CORTEX-U7

Interface de configuration avancée avec **730+ paramètres** répartis sur 12 modules :

| Module | Fonctions | Sous-systèmes |
|--------|-----------|---------------|
| �️ **Navigator** | 78 | GPS stealth, VIO, LiDAR SLAM, Navigation céleste, EKF Fusion, Path Planning |
| 🛡️ **Sentinel** | 86 | Détection RF/acoustique/radar/thermique, Classification menaces, Évasion, Contre-mesures |
| 🧠 **Brain** | 78 | Moteur décisionnel, Machine à états (FSM), Apprentissage adaptatif, Coordination, Failsafe |
| � **Communication** | 54 | Radio (2.4/5.8GHz), Mesh network, Data link vidéo H.265, Chiffrement AES-256, Anti-jamming |
| ⚠️ **Diagnostics** | 52 | BITE, Santé système, Prédiction pannes, Alertes, Logging |
| 👁️ **Perception** | 74 | Computer Vision (YOLOv8), LiDAR processing, Sensor fusion Kalman, Scene understanding |
| 🎯 **Mission** | 56 | Planification, Waypoints, Zones interdites, Contingences, RTL |
| 📷 **Camera** | 50 | Multi-spectral (RGB/IR/thermique), Gimbal, Tracking, Recording |
| � **Power** | 46 | Gestion batterie, Estimation autonomie, Seuils critiques, Charge |
| 🌡️ **Thermal** | 40 | Monitoring température, Refroidissement, Protection surchauffe |
| 🐝 **Swarm** | 64 | Réseau mesh, Formations (ligne/V/cercle), Coordination RAFT, Allocation tâches |
| � **Payload** | 52 | Charge utile, Actionneurs, Capteurs additionnels |

### Détail des Modules Principaux

#### 🗺️ Navigator (78 fonctions)

```
├── GPS Management
│   ├── Stealth mode (burst activation)
│   ├── Spoofing detection
│   ├── Jamming threshold (-120 à -40 dBm)
│   └── HDOP/satellites requirements
├── Visual-Inertial Odometry (VIO)
│   ├── Feature tracking (50-500 points)
│   ├── Drift threshold
│   ├── Keyframe management
│   └── IMU preintegration
├── LiDAR SLAM
│   ├── Range (20-200m)
│   ├── Resolution (0.01-0.5m)
│   └── Ground filtering
├── Celestial Navigation
│   ├── Sun tracking
│   ├── Star catalog (min 2-10 étoiles)
│   └── Refraction correction
├── EKF Fusion
│   ├── Sensor weights (IMU/VIO/GPS/LiDAR/Celestial)
│   ├── Update rate (50-500 Hz)
│   ├── Mahalanobis outlier rejection
│   └── Bias estimation
└── Path Planning
    ├── Algorithms (A*, RRT*, Dijkstra, D* Lite, PRM)
    ├── Obstacle clearance
    ├── Dynamic replanning
    └── Energy optimization
```

#### 🛡️ Sentinel (86 fonctions)

```
├── Threat Detection
│   ├── RF (100-6000 MHz, sensibilité 0-1)
│   ├── Acoustic (seuil dB configurable)
│   ├── Radar cross-section
│   ├── Visual AI (confidence 0.85)
│   └── Thermal signatures
├── Threat Classification
│   ├── Niveaux LOW/MEDIUM/HIGH (seuils configurables)
│   ├── Human detection
│   ├── Vehicle classification
│   └── Weapon detection
├── Evasion Maneuvers
│   ├── Aggressiveness (0-1)
│   ├── Max velocity (20 m/s)
│   ├── Terrain masking
│   ├── NOE flight (Nap-of-the-Earth)
│   └── Pop-up maneuvers
└── Countermeasures
    ├── GPS jamming → Celestial nav fallback
    ├── RF jamming → Frequency hopping
    ├── IR suppression
    └── Decoy deployment (optional)
```

#### 🧠 Brain (78 fonctions)

```
├── Decision Engine
│   ├── Autonomous mode toggle
│   ├── Decision frequency (1-50 Hz)
│   ├── Confidence threshold (0.75)
│   ├── Risk tolerance
│   └── Abort threshold
├── State Machine (FSM)
│   ├── States: IDLE, TAKEOFF, HOVER, WAYPOINT, RTL, LAND, EMERGENCY
│   ├── Transition delays
│   ├── Auto-recovery
│   └── Emergency override
├── Adaptive Learning
│   ├── Learning rate (0.01)
│   ├── Experience buffer (1000 samples)
│   └── Policy update interval
└── Safety
    ├── Geofence (lat/lon bounds)
    ├── Altitude limits (2-120m)
    ├── Battery reserve (20%)
    └── Failsafe triggers
```

#### 🐝 Swarm (64 fonctions)

```
├── Network
│   ├── Mesh topology
│   ├── Heartbeat interval (500ms)
│   ├── Auto-discovery
│   └── Max swarm size (10 drones)
├── Formation
│   ├── Types: LINE, V, CIRCLE, DIAMOND, CUSTOM
│   ├── Spacing (10m)
│   ├── Altitude separation
│   └── Dynamic reformation
├── Coordination
│   ├── Leader election (RAFT consensus)
│   ├── Task allocation (Auction-based)
│   ├── Cooperative sensing
│   └── Shared mapping
└── Communication
    ├── Broadcast/Unicast
    ├── Message relay (max 3 hops)
    ├── QoS priority
    └── Bandwidth limiting
```

---

## 🖥️ Dashboard Pro

Interface cockpit militaire temps réel optimisée 1920x1080 :

| Composant | Description | Technologie |
|-----------|-------------|-------------|
| 🎮 **HUD Télémétrie** | Altitude, vitesse, cap, batterie, satellites | React + CSS animations |
| 🎯 **Radar Menaces** | Visualisation 360° avec niveaux de menace | Canvas 2D |
| 🤖 **Drone 3D** | Modèle avec attitude temps réel (roll/pitch/yaw) | Three.js + React Three Fiber |
| 🗺️ **Carte Mission** | Trajectoire, waypoints, position | Leaflet + OpenStreetMap |
| 📹 **FPV Stream** | Flux vidéo embarqué simulé | Canvas |
| 🔄 **FSM Visualizer** | Machine à états avec transitions | SVG animé |
| 📊 **Sensor Panel** | État capteurs (GPS, LiDAR, VIO, Camera) | React |

### Effets Visuels

- **CRT Scanlines** — Effet rétro militaire
- **Glow animations** — Indicateurs d'état
- **Gradient backgrounds** — Thème cyan/blue
- **Real-time updates** — 60 FPS

---

## 🔐 HCS-SHIELD (Human Control System)

Système d'authentification cognitive anti-bot et anti-détournement :

### Tests Cognitifs

| Test | Mesure | Seuils |
|------|--------|--------|
| **Reaction Test** | Temps de réaction (ms) | 150-800ms humain |
| **Stroop Test** | Interférence cognitive | Effet Stroop 50-200ms |

### Métriques Analysées

```
├── Timing
│   ├── Reaction time
│   ├── Touch duration
│   └── Inter-tap intervals
├── Touch Dynamics
│   ├── Pressure patterns
│   ├── Touch area
│   └── Coordinate variance
├── Cognitive
│   ├── Stroop effect (congruent vs incongruent)
│   ├── Error rate
│   └── Learning curve
└── Behavioral
    ├── Hesitation patterns
    ├── Correction attempts
    └── Fatigue indicators
```

### Classification

- **HUMAN** — Comportement humain confirmé
- **LIKELY_HUMAN** — Forte probabilité humaine
- **UNCERTAIN** — Tests supplémentaires requis
- **LIKELY_BOT** — Comportement suspect
- **BOT** — Automatisation détectée

### Sécurité HCS

| Composant | Fonction |
|-----------|----------|
| **WebAuthn** | Authentification biométrique FIDO2 |
| **Duress Manager** | Détection contrainte (PIN de détresse) |
| **Crypto Shredder** | Effacement sécurisé d'urgence |
| **Tamper Detector** | Détection manipulation mémoire |
| **Ephemeral QR** | Codes QR à usage unique |

---

## � Intégration ROS2

Communication WebSocket avec rosbridge_suite :

### Topics Supportés

```typescript
// Subscriptions
/cortex/position      → DronePosition { lat, lon, alt }
/cortex/velocity      → DroneVelocity { vx, vy, vz, speed }
/cortex/state         → DroneState { state, battery, armed }
/cortex/threat        → ThreatData { level, direction, distance, type }
/cortex/navigation    → NavigationStatus { status, target, eta }
/cortex/celestial     → CelestialData { integrity, sun, stars }

// Publications
/cortex/cmd/waypoint  → Waypoint { lat, lon, alt, speed }
/cortex/cmd/state     → StateCommand { command }
```

### Configuration

```typescript
const config: RosBridgeConfig = {
  url: 'ws://localhost:9090',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
}
```

---

## 🏗️ Architecture

### Structure du Projet

```
celestial-integrity-demo/
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Navigation, langue (FR/EN), thème
│   │   ├── SimulationPanel.tsx        # Configuration capteurs + scénarios
│   │   ├── VisualizationPanel.tsx     # Dôme céleste SVG interactif
│   │   ├── MetricsPanel.tsx           # Résultats validation + historique
│   │   ├── NavigationMap.tsx          # Carte Leaflet avec trajectoire
│   │   ├── RosStatusIndicator.tsx     # Indicateur connexion ROS2
│   │   │
│   │   ├── control-center/            # 🎛️ Centre de contrôle (730+ params)
│   │   │   ├── ControlCenter.tsx      # Interface principale + tabs
│   │   │   ├── NavigatorConfig.tsx    # Navigation (78 fonctions)
│   │   │   ├── SentinelConfig.tsx     # Sécurité (86 fonctions)
│   │   │   ├── BrainConfig.tsx        # IA décisionnelle (78 fonctions)
│   │   │   ├── CommunicationConfig.tsx# Communications (54 fonctions)
│   │   │   ├── DiagnosticsConfig.tsx  # Diagnostics (52 fonctions)
│   │   │   ├── PerceptionConfig.tsx   # Perception (74 fonctions)
│   │   │   ├── MissionConfig.tsx      # Mission (56 fonctions)
│   │   │   ├── CameraConfig.tsx       # Caméras (50 fonctions)
│   │   │   ├── PowerConfig.tsx        # Énergie (46 fonctions)
│   │   │   ├── ThermalConfig.tsx      # Thermique (40 fonctions)
│   │   │   ├── SwarmConfig.tsx        # Essaim (64 fonctions)
│   │   │   ├── PayloadConfig.tsx      # Charge utile (52 fonctions)
│   │   │   ├── IntelligenceMonitor.tsx# Monitoring IA temps réel
│   │   │   ├── ROS2Communication.tsx  # Interface topics ROS2
│   │   │   ├── DecisionLogs.tsx       # Logs décisions IA
│   │   │   └── ConfigHelpers.tsx      # Composants UI (Switch, Slider, Select)
│   │   │
│   │   ├── dashboard/                 # 🖥️ Dashboard Pro (cockpit)
│   │   │   ├── DashboardPro.tsx       # Interface principale 1920x1080
│   │   │   ├── DroneModel3D.tsx       # Modèle drone Three.js
│   │   │   ├── CelestialDome3D.tsx    # Dôme céleste 3D
│   │   │   ├── TelemetryHUD.tsx       # HUD altitude/vitesse/cap
│   │   │   ├── ThreatRadar.tsx        # Radar 360° Canvas
│   │   │   ├── FSMVisualizer.tsx      # Machine à états SVG
│   │   │   ├── FPVStream.tsx          # Flux vidéo simulé
│   │   │   └── SensorPanel.tsx        # État capteurs
│   │   │
│   │   ├── shield/                    # 🔐 Tests cognitifs
│   │   │   ├── ShieldAuthModal.tsx    # Modal authentification
│   │   │   ├── ReactionTest.tsx       # Test temps de réaction
│   │   │   └── StroopTest.tsx         # Test de Stroop
│   │   │
│   │   ├── hcs/                       # 👤 Human Control System
│   │   │   ├── HcsAuthPage.tsx        # Page authentification
│   │   │   └── HcsShieldPanel.tsx     # Panneau contrôle SHIELD
│   │   │
│   │   └── ui/                        # 🎨 Composants shadcn/ui
│   │       ├── accordion.tsx
│   │       ├── tabs.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── celestialValidator.ts      # Validateur intégrité multi-capteurs
│   │   ├── ephemeris.ts               # Position solaire (VSOP87)
│   │   ├── stars.ts                   # Catalogue 10 étoiles + calculs
│   │   ├── magnetometer.ts            # Modèle IGRF-13 simplifié
│   │   ├── crypto.ts                  # HMAC-SHA3-512, Hamming distance
│   │   ├── utils.ts                   # cn() merge classes
│   │   │
│   │   ├── ros/                       # 🔌 Intégration ROS2
│   │   │   ├── rosbridge.ts           # Client WebSocket rosbridge
│   │   │   ├── useRosBridge.ts        # Hook React pour ROS2
│   │   │   └── index.ts               # Exports + types
│   │   │
│   │   ├── shield/                    # 🛡️ Détection bot/humain
│   │   │   ├── detector.ts            # Analyseur comportemental
│   │   │   ├── types.ts               # Types + config SHIELD
│   │   │   └── index.ts
│   │   │
│   │   └── hcs/                       # 🔒 Sécurité HCS
│   │       ├── storage/
│   │       │   ├── db.ts              # IndexedDB (Dexie)
│   │       │   ├── profile-store.ts   # Stockage profil cognitif
│   │       │   └── test-results-store.ts
│   │       ├── crypto/
│   │       │   ├── b3-hash.ts         # BLAKE3 hashing
│   │       │   ├── qsig-local.ts      # Signatures locales
│   │       │   └── hcs-generator.ts   # Générateur codes HCS
│   │       ├── security/
│   │       │   ├── webauthn-manager.ts# FIDO2/WebAuthn
│   │       │   ├── duress-manager.ts  # Gestion contrainte
│   │       │   ├── crypto-shredder.ts # Effacement sécurisé
│   │       │   ├── tamper-detector.ts # Détection manipulation
│   │       │   └── ephemeral-qr.ts    # QR codes temporaires
│   │       ├── cognitive/
│   │       │   └── quick-stroop.ts    # Logique test Stroop
│   │       └── index.ts
│   │
│   ├── i18n/
│   │   ├── fr.json                    # 🇫🇷 Traductions françaises
│   │   ├── en.json                    # 🇬🇧 Traductions anglaises
│   │   └── i18n.ts                    # Config react-i18next
│   │
│   ├── App.tsx                        # Composant racine + routing
│   ├── main.tsx                       # Point d'entrée React
│   └── index.css                      # Tailwind + styles globaux
│
├── public/
│   └── vite.svg
│
├── package.json                       # Dépendances + scripts
├── tsconfig.json                      # Config TypeScript
├── tailwind.config.ts                 # Config Tailwind CSS
├── vite.config.ts                     # Config Vite
└── README.md
```

### Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORTEX-U7 Frontend                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Dashboard  │    │   Control    │    │    Shield    │       │
│  │     Pro      │    │   Center     │    │     Auth     │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └─────────┬─────────┴─────────┬─────────┘                │
│                   │                   │                          │
│         ┌─────────▼─────────┐ ┌───────▼────────┐                │
│         │   useRosBridge    │ │  shieldDetector │                │
│         │   (React Hook)    │ │  (Cognitive AI) │                │
│         └─────────┬─────────┘ └───────┬────────┘                │
│                   │                   │                          │
├───────────────────┼───────────────────┼──────────────────────────┤
│                   │                   │                          │
│         ┌─────────▼─────────┐ ┌───────▼────────┐                │
│         │    RosBridge      │ │   IndexedDB    │                │
│         │   WebSocket       │ │    (Dexie)     │                │
│         └─────────┬─────────┘ └────────────────┘                │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   rosbridge_suite     │
        │   (ws://localhost:9090)│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │       ROS2 Core       │
        │   (Drone Autopilot)   │
        └───────────────────────┘
```

---

## 🚀 Installation & Développement

### Prérequis

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0

### Installation

```bash
# Cloner le repository
git clone https://github.com/ia-solution/celestial-integrity-demo.git
cd celestial-integrity-demo

# Installer les dépendances
npm install
```

### Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvre http://localhost:5173
```

### Build Production

```bash
# Build optimisé
npm run build

# Preview du build
npm run preview
```

### Lint

```bash
npm run lint
```

---

## 📦 Stack Technique

### Core

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | React | 18.2 |
| **Langage** | TypeScript | 5.9 |
| **Build** | Vite | 7.2 |
| **Styling** | Tailwind CSS | 3.4 |

### UI & Visualisation

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| **Components** | Radix UI | Accordion, Tabs, Switch, Slider, Tooltip |
| **Icons** | Lucide React | 400+ icônes vectorielles |
| **Charts** | Recharts | Graphiques temps réel |
| **3D** | Three.js + React Three Fiber | Drone 3D, dôme céleste |
| **Maps** | Leaflet + React Leaflet | Carte mission |
| **Animations** | tailwindcss-animate | Transitions fluides |

### Données & État

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| **State** | Zustand | État global léger |
| **Storage** | Dexie (IndexedDB) | Profils cognitifs, résultats tests |
| **i18n** | react-i18next | FR/EN |

### Calculs & Crypto

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| **Astronomie** | astronomy-engine | VSOP87, positions célestes |
| **Crypto** | @noble/hashes | SHA3-512, HMAC |
| **QR** | qrcode | QR codes éphémères |

### Communication

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| **ROS2** | rosbridge_suite | WebSocket bridge |
| **Notifications** | Sonner | Toasts |

---

## 📋 Roadmap

### Implémenté ✅

- [x] Centre de contrôle 12 modules (730+ paramètres)
- [x] Dashboard Pro temps réel (1920x1080)
- [x] Drone 3D avec attitude
- [x] Radar menaces 360°
- [x] Carte mission Leaflet
- [x] HCS-SHIELD authentification cognitive
- [x] Intégration ROS2 WebSocket
- [x] Validation intégrité céleste
- [x] Bilingue FR/EN
- [x] Thème dark/light

### En cours 🔄

- [ ] Export/Import configurations JSON
- [ ] Tests unitaires Vitest
- [ ] Documentation TypeDoc

### Planifié 📅

- [ ] PWA offline support
- [ ] Catalogue 50+ étoiles
- [ ] Modèle IGRF-13 complet
- [ ] Simulation météo
- [ ] Mode mobile optimisé
- [ ] API REST externe

---

## 📜 Brevets

| Référence | Titre | Status |
|-----------|-------|--------|
| **FR2514274** | Méthode de validation d'intégrité de position par observations célestes | Déposé |
| **FR2514546** | Système de consensus cryptographique multi-capteurs pour drones | Déposé |

---

## 📄 Licence

**Propriétaire** — © IA-SOLUTION 2025

Tous droits réservés. Ce logiciel est la propriété exclusive d'IA-SOLUTION.
Toute reproduction, distribution ou utilisation non autorisée est interdite.

---

## 📞 Contact

**IA-SOLUTION**

| | |
|---|---|
| 📧 Email | contact@ia-solution.com |
| 🌐 Website | https://ia-solution.fr |
| 🐙 GitHub | https://github.com/ia-solution |

---

<p align="center">
  <strong>CORTEX-U7</strong> — Autonomous Drone Control Platform<br/>
  <em>Built with ❤️ by IA-SOLUTION</em>
</p>
