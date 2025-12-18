# HCS-U7 Architecture - Extracted from PWA

> Documentation extraite de `hcs-u7-mobile-pwa` pour implémentation dans le projet drones

---

## 1. Structure du Code HCS-U7

### Format du Code HCS
```
HCS-U7|V:8.0|ALG:QS|E:M|MOD:c75f25m0|COG:F85C90V70S80Cr75|QSIG:xxxxxxxxxx|B3:xxxxxxxxxx
```

### Composants du Code
| Segment | Description | Exemple |
|---------|-------------|---------|
| `HCS-U7` | Identifiant protocole | - |
| `V:8.0` | Version | 8.0 |
| `ALG:QS` | Algorithme (Quantum-Safe) | QS |
| `E:M` | Environment (Mobile) | M |
| `MOD:c75f25m0` | Modalité (cognitive/form/motion) | c75f25m0 |
| `COG:F85C90V70S80Cr75` | Vecteurs cognitifs | 5 dimensions |
| `QSIG` | Signature quantique-résistante | 10 chars |
| `B3` | Hash biométrique comportemental | 10 chars |

### Vecteurs Cognitifs (COG)
- **F** (Fine Motor) : Précision motrice fine (0-100)
- **C** (Cognitive) : Performance cognitive Stroop (0-100)
- **V** (Velocity) : Vitesse réaction + coordination (0-100)
- **S** (Stability) : Régularité scroll (0-100)
- **Cr** (Creativity/Pattern) : Pattern + Mémoire + Variabilité (0-100)

---

## 2. Tests Cognitifs (7 Tests)

### 2.1 Test de Réaction (`reaction`)
```typescript
interface ReactionStats {
  mean: number;      // Temps moyen (ms)
  std: number;       // Écart-type
  best: number;      // Meilleur temps
  worst: number;     // Pire temps
  consistency: number; // Score consistance (%)
  count: number;     // Nombre d'essais
}
```
- **Trials**: 5 essais
- **Métrique clé**: `reactionTime` (150-400ms = humain normal)
- **Score**: Consistance = `(1 - std/mean) * 100`

### 2.2 Test Mémoire (`memory`)
```typescript
interface MemoryResult {
  level: number;      // Difficulté (1-3)
  moves: number;      // Coups joués
  pairs: number;      // Paires trouvées
  duration: number;   // Temps total (ms)
  score: number;      // Score (%)
}
```
- **Mécanisme**: Jeu de paires (Memory)
- **Calcul score**: `(moveEfficiency + timeBonus) / 2`
- **Paires**: 6/8/10 selon niveau

### 2.3 Test Traçage (`tracing`)
```typescript
interface TracingResult {
  pattern: 'circle' | 'square' | 'zigzag';
  accuracy: number;   // Précision (%)
  duration: number;   // Temps (ms)
  pathLength: number; // Points capturés
}
```
- **Patterns**: Cercle, Carré, Zigzag
- **Précision**: Distance moyenne au tracé idéal
- **Capture**: Touch + Motion (gyroscope)

### 2.4 Test Pattern (`pattern`)
```typescript
interface PatternResult {
  isCorrect: boolean;
  reactionTime: number;
  sequence: string;
  userAnswer: string;
  expectedAnswer: string;
}
```
- **Mécanisme**: Compléter une séquence de symboles
- **Symboles**: 🔵, 🔺, 🟢, ⭐, 🔶
- **Score**: 100% si correct, 0% sinon

### 2.5 Test Scroll (`scroll`)
```typescript
interface ScrollResult {
  duration: number;
  scrollPoints: number;
  averageVelocity: number;
  maxVelocity: number;
  regularityScore: number; // 0-1
}
```
- **Durée**: 10 secondes max
- **Régularité**: `1 - min(stdVelocity/avgVelocity, 1)`

### 2.6 Test Coordination (`coordination`)
```typescript
interface CoordinationResult {
  totalDuration: number;
  targetsCount: number;       // 5 cibles
  tapsCount: number;
  averageTimeBetweenTaps: number;
}
```
- **Cibles**: 5 boutons à positions aléatoires
- **Score**: Vitesse = `1000 / avgTimeBetweenTaps * 10`

### 2.7 Test Stroop/Couleur (`color`)
```typescript
interface StroopResult {
  avgCongruent: number;     // Temps moyen congruent (ms)
  avgIncongruent: number;   // Temps moyen incongruent (ms)
  stroopEffect: number;     // Différence (ms)
  accuracy: number;         // Précision (%)
}
```
- **Trials**: 10 essais
- **Effet Stroop**: `avgIncongruent - avgCongruent`
- **Humain typique**: Effet Stroop 20-400ms

---

## 3. Cryptographie et Sécurité

### 3.1 B3-Hash (Behavioral Biometric Blockchain Hash)
```typescript
class B3Hash {
  hash(data: any): string {
    const preprocessed = this.preprocessBiometricData(data);
    // 3 rounds de transformation
    for (let i = 0; i < 3; i++) {
      hash = this.biometricRound(hash, i);
    }
    return this.formatHash(hash); // Hex uppercase
  }
}
```
- **Rounds**: 3 (COGNITIVE_ALPHA, BEHAVIORAL_BETA, TEMPORAL_GAMMA)
- **Features**: Timing, Motion, Touch, Pattern
- **Output**: Hash hexadécimal 64 chars

### 3.2 QSIG (Quantum-Safe Signature)
```typescript
class QSigLocal {
  generateSignature(data: any): string {
    const normalized = this.normalizeData(data);
    const hash = this.multiLayerHash(normalized);
    return this.latticeBasedSign(hash); // 16 chars hex
  }
}
```
- **Multi-layer hash**: 3 couches SHA-like
- **Lattice-based**: Simulation signature réseau (8x8)

### 3.3 WebAuthn Manager
```typescript
class WebAuthnManager {
  async enrollDevice(pilotId: string): Promise<WebAuthnCredential> {
    // TPM/Secure Enclave binding
    // ES256 (ECDSA P-256) ou RS256
    // userVerification: 'required' (biométrie/PIN)
  }
  
  async deriveEncryptionKey(credentialId: string): Promise<CryptoKey> {
    // PBKDF2 100k iterations
    // AES-256-GCM
    // Salt: 'HCS-U7-DEVICE-BINDING'
  }
}
```

### 3.4 Chiffrement Profil (SecureProfileStore)
```typescript
// Algorithme: AES-256-GCM
// IV: 12 bytes (96 bits)
// Clé: Dérivée du credentialId via PBKDF2
// Intégrité: SHA-256 hash du profil chiffré
```

---

## 4. Système de Sécurité (7 Couches)

### 4.1 Hardware Binding (WebAuthn)
- Enrollment via TPM/Secure Enclave
- Clé non-extractible
- Biométrie obligatoire

### 4.2 QR Éphémères
```typescript
class EphemeralQRManager {
  // Expiration: 30 minutes
  // Read token: Usage unique (anti-replay)
  // Chiffrement: AES-256-GCM avec clé HKDF
  // Destruction: Suppression read token = QR mort
}
```

### 4.3 Duress Mode (Déni Plausible)
```typescript
class DuressManager {
  // PIN Normal: Accès complet
  // PIN Duress: Dernier chiffre +1 → Profil leurre
  // Stockage: Hash SHA-256 des PINs
  // Données leurres: Scores médiocres, missions training
}
```

### 4.4 Crypto-Shredder
```typescript
class CryptoShredder {
  async panicWipe(): Promise<ShredResult> {
    // Multi-pass overwrite (Random → Zeros → Ones)
    // Suppression IndexedDB complète
    // Clear localStorage/sessionStorage
    // Révocation clés WebAuthn (marquage)
  }
}
```

### 4.5 Tamper Detector
```typescript
interface TamperReport {
  checks: TamperCheck[];  // 7 checks
  overallRisk: 'SAFE' | 'SUSPICIOUS' | 'COMPROMISED';
  recommendedAction: 'ALLOW' | 'WARN' | 'LOCK' | 'WIPE';
}
```

**7 Checks:**
1. **Debugger Detection** - Timing du `debugger` statement
2. **DevTools Detection** - Différence window inner/outer
3. **Environment Check** - Variables globales suspectes
4. **Timing Anomalies** - Variance performance.now()
5. **User Agent Validation** - Cohérence UA/Platform
6. **Storage Integrity** - Hash SHA-256 du profil
7. **WebAuthn Availability** - Présence API

### 4.6 Quick Stroop Challenge (Proof-of-Presence)
```typescript
class QuickStroopTest {
  // 10 trials, 15 secondes
  // Détection bot via:
  //   - Temps réaction (150-1500ms = humain)
  //   - Effet Stroop présent (20-400ms)
  //   - Accuracy raisonnable (60-100%)
  //   - Variance temps > 2000
  // humanScore: 0-1
}
```

### 4.7 Anonymous History
- Logs anonymisés (fingerprint pilote hashé)
- Pas de PII dans les logs mission

---

## 5. Stockage (IndexedDB - Dexie)

### Schema Database
```typescript
class HcsDatabase extends Dexie {
  testResults!: Table<TestResult, number>;
  userProfiles!: Table<UserProfile, number>;
  missions!: Table<Mission, string>;
  missionLogs!: Table<MissionLog, string>;
}
```

### UserProfile
```typescript
interface UserProfile {
  id?: number;
  createdAt: number;
  updatedAt: number;
  hcsCode?: string;
  deviceCredential?: string;
  encryptedProfile?: ArrayBuffer;
  integrityHash?: string;
  cognitiveProfile?: {
    reactionTime: { mean, std, best, worst, testCount };
    memory: { accuracy, testCount };
    precision: { mean, std, testCount };
    pattern: { accuracy, testCount };
    scroll: { regularity, testCount };
    coordination: { speed, testCount };
    stroop: { effect, testCount };
  };
  testHistory?: Array<{ testType, timestamp, score }>;
}
```

### TestResult
```typescript
interface TestResult {
  id?: number;
  testType: 'reaction' | 'memory' | 'tracing' | 'pattern' | 'scroll' | 'coordination' | 'color';
  timestamp: number;
  duration?: number;
  score?: number;
  metadata: any;
  deviceInfo: { userAgent, screenWidth, screenHeight, pixelRatio };
}
```

---

## 6. Génération du Code HCS

### Algorithme HcsCodeGenerator
```typescript
async generateHcsCode(): Promise<string> {
  // 1. Minimum 5 tests requis
  // 2. Extraire métriques cognitives
  // 3. Générer vecteurs cognitifs (F, C, V, S, Cr)
  // 4. Calculer QSIG (HMAC-SHA256)
  // 5. Calculer B3 (SHA-256)
  // 6. Assembler code final
}
```

### Formules des Vecteurs
```typescript
// F (Fine Motor) = precision.mean / 100
// C (Cognitive) = stroop.accuracy / 100
// V (Velocity) = 0.6 * (1 - normalize(reactionTime, 150, 400)) 
//              + 0.4 * normalize(coordination.speed, 0, 10)
// S (Stability) = scroll.regularity / 100
// Cr (Creativity) = 0.5 * pattern.accuracy + 0.3 * memory.score + 0.2 * variability
```

---

## 7. Internationalisation (i18n)

- **Store**: Zustand avec persistance
- **Langues**: FR (défaut), EN
- **Hook**: `useTranslation()`
- **Fichier**: `lib/i18n/translations.ts`

---

## 8. Dépendances Clés

```json
{
  "dexie": "^4.0.0",           // IndexedDB wrapper
  "@noble/hashes": "^1.3.0",   // HKDF, SHA256
  "zustand": "^4.5.0",         // State management
  "next": "15.x",              // Framework
  "tailwindcss": "^3.4.0"      // Styling
}
```

---

## 9. Points d'Intégration pour Drones

1. **Validation Pilote**: Vérifier code HCS avant mission
2. **QR Mission**: Générer QR éphémère avec waypoints chiffrés
3. **Proof-of-Presence**: Quick Stroop avant actions critiques
4. **Panic Button**: Destruction données si compromission
5. **Logs Anonymes**: Audit trail sans PII
