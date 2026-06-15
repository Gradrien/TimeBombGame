# Stabilité du jeu & sécurité des comptes

Ce document décrit les mécanismes ajoutés pour (1) rendre les parties robustes
face aux aléas du websocket et (2) sécuriser les mots de passe (PIN) des comptes.

## 1. Hachage des mots de passe (PIN)

### Pourquoi
Les PIN étaient auparavant stockés en clair dans `User.pinCode`. Ils sont
désormais hachés avec **scrypt** (KDF salé et résistant à la mémoire, intégré à
Node — aucune dépendance supplémentaire).

### Où
- `src/services/passwordService.ts` — responsabilité unique (SRP) : `hashPassword`,
  `verifyPassword` (comparaison à temps constant) et `isHashed`.
- `src/services/authService.ts` — orchestre l'authentification.

Format stocké, auto-descriptif pour pouvoir évoluer :

```
scrypt$<keyLength>$<saltHex>$<hashHex>
```

### Le secret ne quitte jamais le serveur
`authService` renvoie l'utilisateur via `toSafeUser`, qui retire `pinCode`. Le
client ne reçoit donc jamais le hash ; il ne conserve localement que le PIN
saisi par le joueur (pour préremplir le formulaire).

## 2. Migration des comptes existants

Les comptes créés avant le hachage ont un PIN en clair. Deux mécanismes
complémentaires, **idempotents**, les migrent sans que le joueur change de PIN :

1. **Migration paresseuse (à la connexion)** — dans `authService` : si le PIN
   stocké n'est pas haché (`isHashed === false`), on compare en clair puis on
   le ré-enregistre haché. Le joueur se connecte avec le même PIN qu'avant.

2. **Migration en masse (hors-ligne)** — script
   `prisma/migrate-passwords.ts`, à lancer une fois :

   ```bash
   npm run migrate:passwords --workspace=server
   ```

   Il parcourt toute la table `User`, hache les PIN encore en clair et ignore
   ceux déjà hachés. Aucune migration de schéma Prisma n'est nécessaire (la
   colonne `pinCode` reste un `String`).

## 3. Robustesse websocket / parties sans interruption

### Configuration du serveur (`src/index.ts`)
- `pingInterval` / `pingTimeout` réglés pour détecter rapidement une connexion
  morte tout en tolérant les coupures courtes (mobile, onglet en arrière-plan).
- `connectionStateRecovery` activé : Socket.IO restaure la session et rejoue les
  événements manqués lors d'une reconnexion dans la fenêtre impartie.
- Endpoint `/health` pour les sondes de l'orchestrateur.

### Gestion des connexions (`src/roomManager.ts`)
- Chaque joueur porte un drapeau `connected`. À la déconnexion, le siège n'est
  **pas** retiré immédiatement : le joueur est marqué déconnecté (les autres le
  voient grisé dans le lobby) et un **délai de grâce** (`RECONNECT_GRACE_MS`,
  60 s) est armé.
- À l'expiration du délai :
  - si le joueur est revenu, rien ne se passe ;
  - si la room est entièrement abandonnée (tous déconnectés), elle est
    **détruite** avec ses timers (pas de fuite mémoire) ;
  - en lobby uniquement, le siège d'un absent est libéré (l'hôte est réassigné
    au besoin).
- En pleine partie, le siège est conservé : le joueur peut se reconnecter à tout
  moment via `checkReconnection` / `joinRoom`, sans interrompre la partie.

### Principes de conception
- **DRY** : la remise en lobby (restart & abandon) passe par `resetRoomToLobby` ;
  le retrait d'un joueur par `removePlayer` ; la destruction par `destroyRoom`.
- **SRP** : connexions (`markConnected`/`handleDisconnect`), cycle de vie des
  rooms et hachage des mots de passe sont isolés dans des fonctions/services
  dédiés.
- **KISS** : pas de store externe ni de dépendance native ajoutée ; on s'appuie
  sur les primitives intégrées (scrypt) et sur Socket.IO.
