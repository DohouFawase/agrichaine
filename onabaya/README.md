# Onabaya Mobile

Onabaya est une application mobile de mise en relation agricole au Benin. Elle permet de publier des recoltes, acheter des produits, reserver une livraison, suivre une commande et gerer les paiements.

Ce dossier contient le client mobile Expo/React Native. L'API Laravel se trouve dans le dossier voisin `../agricultural`.

## Documentation

- [README_TACHES.md](README_TACHES.md) : suivi quotidien des tickets.
- [AUDIT_ACTIONS_SECURITE.md](AUDIT_ACTIONS_SECURITE.md) : audit complet, priorites et securite.
- [AGENTS.md](AGENTS.md) : consignes Expo du projet.

## Etat du projet

Les parcours principaux sont presents mais encore en stabilisation. Les roles acheteur, producteur et transporteur sont amorces. Le catalogue, les commandes, le wallet, le suivi GPS, les notifications, les QR Codes et le paiement Mobile Money sont integres partiellement.

La compilation TypeScript, le lint, les routes et plusieurs actions metier doivent etre finalises avant une release. Le calcul et l'affichage TTC doivent aussi etre alignes avec le contrat backend definitif.

## Fonctionnalites par role

### Authentification

- Inscription avec choix du role.
- Connexion par telephone et mot de passe.
- Validation locale avec Zod.
- Injection JWT dans les requetes Axios.
- Recuperation du profil courant.

La garde de session, la deconnexion complete, l'expiration et le stockage securise du token restent a finaliser.

### Acheteur

- Accueil avec commandes actives et produits disponibles.
- Catalogue avec recherche et categories.
- Carte des produits et suivi de livraison.
- Creation de commande avec sequestre.
- Detail commande, timeline et QR livraison.
- Wallet avec recharge et retrait Mobile Money.
- Notifications et fidelite.

### Producteur

- Accueil avec produits, commandes et wallet.
- Publication d'une recolte avec preuve photo du stock.
- Consultation des details produit.
- Reception des nouvelles commandes en temps reel.
- Suivi des commandes et revenus.

La modification et la suppression de produit restent a implementer.

### Transporteur

- Accueil avec courses disponibles et livraisons actives.
- Acceptation d'une course.
- QR de collecte et QR de livraison.
- Suivi des livraisons et de la remuneration.

La persistance du statut chauffeur, les ecrans trajets/statut et certaines transitions restent a finaliser.

## Prix, taxes et TTC

Le backend doit etre la source de verite des montants. Le mobile ne doit jamais etre utilise pour imposer un prix ou un total final.

Le contrat doit distinguer clairement :

- prix ou sous-total HT ;
- taux de taxe ;
- montant de taxe ;
- frais de livraison ;
- total TTC ;
- gain producteur et remuneration transporteur.

Les noms definitifs doivent etre confirmes avec l'API, par exemple `subtotal_ht`, `tax_rate`, `tax_amount` et `total_ttc`. La formule cible est `total_ttc = subtotal_ht + tax_amount`, avec arrondi serveur en FCFA.

Le TTC doit etre coherent dans catalogue, carte, bottom sheet, confirmation, detail commande, wallet, historique, notifications et evenements temps reel. Voir les tickets `TAX-*` dans [README_TACHES.md](README_TACHES.md).

## Architecture

```text
app/                 Routes Expo Router et ecrans
components/          Composants reutilisables et modales
providers/           Thunks Redux et appels API Axios
slice/               Etat Redux Toolkit
stores/              Store et hooks Redux types
types/               Interfaces TypeScript partagees
schemas/             Schemas Zod
hooks/               Theme et hooks metier
api/                 Client Axios et authentification
utils/               Echo/Reverb et utilitaires
assets/              Images et ressources Expo
```

### Routes principales

```text
app/index.tsx                         Onboarding
app/(auth)/                           Inscription et connexion
app/(buyer)/                          Onglets acheteur
app/(producer)/                       Onglets producteur
app/(transporter)/                    Onglets transporteur
app/other/                            Details, notifications et fidelite
app/_layout.tsx                       Redux, theme, Echo et Stack
```

La navigation est basee sur Expo Router et le routage par fichiers. Les chemins doivent correspondre exactement aux fichiers, notamment sur Android ou la casse est sensible.

## Etat global

Redux Toolkit gere les domaines suivants :

- `auth` : utilisateur, token, chargement et erreurs ;
- `home` : accueil selon le role ;
- `products` : catalogue, detail, publication et vues ;
- `orders` : liste, detail, creation, assignation et QR ;
- `wallet` : solde, sequestre, transactions et MoMo ;
- `maps` : produits geolocalises et suivi ;
- `notifications` : liste, badge, lecture, suppression et temps reel ;
- `loyalty` : statuts et commandes recurrentes.

Les appels asynchrones sont principalement des `createAsyncThunk` dans `providers/`.

## API et environnement

Le client Axios lit `EXPO_PUBLIC_API_URL`. En developpement local, cette URL doit etre accessible depuis le telephone ou l'emulateur.

Exemple :

```env
EXPO_PUBLIC_API_URL=http://ADRESSE_IP_LOCALE:8000/api/v1/
YOUR_GOOGLE_MAPS_API_KEY=cle_developpement_restreinte
```

Ne pas committer `.env` ou `.local.env`. Une cle Maps mobile doit etre restreinte par application, APIs autorisees et quotas.

### Endpoints principaux

| Domaine | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, profil courant |
| Accueil | `GET /home` |
| Produits | `GET /products`, `GET /products/{id}`, `POST /products` |
| Commandes | `GET /orders`, `GET /orders/{id}`, `POST /orders`, `POST /orders/assign` |
| QR | `POST /orders/{id}/validate-collection`, `POST /orders/{id}/validate-delivery` |
| Tracking | `GET/POST /orders/{id}/tracking`, synchronisation batch |
| Wallet | `GET /balance`, recharge, retrait et transactions |
| Notifications | liste, badge, detail, lecture et suppression |
| Fidelite | statuts, activation et commandes recurrentes |

Toutes les routes metier doivent etre protegees par JWT et autorisees cote serveur.

## Installation

Prerequis : Node.js compatible Expo SDK 54 et pnpm. Android Studio est necessaire pour Android ; Xcode est necessaire pour iOS sur macOS.

```bash
cd onabaya
pnpm install
pnpm start
```

Commandes disponibles :

```bash
pnpm start          # serveur Metro/Expo
pnpm android        # Android
pnpm ios            # iOS, macOS requis
pnpm web            # web
pnpm lint           # ESLint Expo
```

Pour un telephone physique, utiliser l'adresse IP locale de la machine et verifier le pare-feu ainsi que le port Laravel.

## Verification

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Tests backend depuis le dossier Laravel :

```bash
cd ../agricultural
docker compose exec laravel.test php artisan test
```

Avant une release, verifier aussi l'export Expo, les routes generees, les permissions camera/localisation, MoMo, le reseau coupe et les petits ecrans.

## Securite

- Ne jamais logger mot de passe, JWT, payload complet ou donnees Mobile Money.
- Utiliser un stockage securise pour le token en production.
- Gerer HTTP 401 avec nettoyage de session et redirection.
- Recalculer prix, stock, frais, taxes et TTC cote backend.
- Verifier role et propriete sur chaque ressource.
- Valider taille, MIME et contenu des fichiers uploades.
- Supprimer ou proteger toute route de test, notamment `/test-momo`.
- Fermer les canaux Echo a la deconnexion.

## Flux de commande

1. Le producteur publie un produit et sa preuve de stock.
2. L'acheteur consulte le catalogue ou la carte.
3. Le mobile affiche HT, taxes, livraison et TTC fournis par l'API.
4. Le backend verifie stock, prix et solde puis bloque les fonds.
5. Un transporteur accepte ou est assigne a la course.
6. Le transporteur scanne le QR de collecte.
7. La livraison est suivie puis validee par QR cote acheteur.
8. Le backend libere les fonds selon la transition metier.
9. Wallet, notifications et historiques sont actualises.

## Temps reel

Laravel Reverb/Echo est utilise pour les notifications et certains changements de commande. Les composants doivent attendre une session valide, utiliser le canal du bon utilisateur, eviter les doublons API/WebSocket, gerer la reconnexion et quitter les canaux au demontage ou a la deconnexion.

## Contribution

1. Lire [README_TACHES.md](README_TACHES.md) et choisir un ticket.
2. Verifier le contrat backend avant de modifier l'interface.
3. Limiter les changements au ticket.
4. Ajouter ou mettre a jour les tests.
5. Executer TypeScript, lint et tests backend.
6. Mettre a jour la checklist et la preuve de validation.

## Definition de fini

- TypeScript, lint, tests backend et build Expo passent.
- Chaque route referencee existe sur Android et iOS.
- Chaque bouton visible a une action et un retour utilisateur.
- Les montants HT, taxes, frais et TTC sont coherents dans tous les roles.
- Aucun secret, mot de passe ou token n'est expose dans les logs ou le depot.
- Les parcours acheteur, producteur et transporteur sont verifies de bout en bout.
