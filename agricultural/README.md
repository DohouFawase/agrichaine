# Onabaya Backend

API Laravel de la plateforme agricole Onabaya.

Suivi des travaux : [README_TACHES_BACKEND.md](README_TACHES_BACKEND.md).

Onabaya met en relation trois profils :

- `producer` : publie et vend des produits agricoles ;
- `buyer` : consulte le catalogue et commande ;
- `transporter` : accepte et réalise les livraisons.

Le backend gère l'authentification JWT, les produits, les commandes, le paiement en XOF, le wallet, le séquestre, le suivi GPS, les notifications et les événements temps réel.

## Etat de l'audit

Les parcours principaux et une suite de tests Feature existent. Avant production, les tickets suivants sont prioritaires :

- fermer la route de test MoMo et le dépôt wallet direct non vérifié ;
- ajouter les contrôles d'accès sur détail commande, tracking batch et transitions ;
- unifier `driver_id`/`transporter_id` et les statuts historiques de commande ;
- rendre assignation, QR, wallet et MoMo idempotents ;
- confirmer puis propager le contrat HT, taxes et TTC ;
- compléter policies, uploads privés, rate limiting, webhooks et tests de concurrence.

Le registre complet avec critères d'acceptation se trouve dans [README_TACHES_BACKEND.md](README_TACHES_BACKEND.md).

## 1. Démarrage rapide

### Prérequis

- PHP `8.3+` ;
- Composer ;
- Docker et Docker Compose recommandés ;
- Node.js et npm pour Vite si nécessaire ;
- MySQL `8.4` ;
- les identifiants Mobile Money uniquement dans `.env`.

### Installation locale

```bash
cd agricultural
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan storage:link
php artisan migrate
npm install
npm run build
```

### Installation Docker / Sail

Le fichier `compose.yaml` démarre `laravel.test` et `mysql`.

```bash
cd agricultural
FORWARD_DB_PORT=3307 APP_PORT=8080 VITE_PORT=5174 docker compose up -d mysql laravel.test
docker compose exec laravel.test php artisan migrate
```

Les ports hôtes `3307`, `8080` et `5174` évitent les conflits fréquents avec MySQL `3306` et HTTP `80`. Les ports internes Docker restent `3306` pour MySQL et `80` pour Laravel.

```bash
docker compose ps
```

Avec cette configuration, Laravel est accessible sur `http://localhost:8080`.

### Variables importantes

```dotenv
APP_ENV=local
APP_URL=http://localhost:8080

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=agrichaine
DB_USERNAME=sail
DB_PASSWORD=password

BROADCAST_CONNECTION=null
QUEUE_CONNECTION=sync
```

Dans un conteneur Laravel, `DB_HOST=mysql` est correct. Depuis la machine hôte, le port publié peut être `3307`.

Après une modification de configuration :

```bash
php artisan config:clear
php artisan cache:clear
```

## 2. Commandes quotidiennes

### Développement

```bash
php artisan serve
npm run dev
php artisan queue:listen --tries=1 --timeout=0
```

Le script `composer run dev` lance le serveur Laravel, la queue, les logs et Vite en parallèle.

### Base de données

```bash
php artisan migrate
php artisan migrate:status
php artisan migrate:fresh --env=testing
```

Avec Docker :

```bash
docker compose exec laravel.test php artisan migrate:fresh --env=testing
```

Ne jamais lancer `migrate:fresh` sur une base de production.

### Tests

```bash
php artisan test
```

Avec Docker :

```bash
docker compose exec laravel.test php artisan test
```

Tests ciblés :

```bash
php artisan test tests/Feature/ApiCoverageTest.php
php artisan test tests/Feature/BroadcastingAndApiTest.php
php artisan test --filter="tracking"
```

La suite validée contient 19 tests et 77 assertions couvrant l'authentification, les API, les wallets, les produits, le tracking, les broadcasts et les workflows de livraison.

## 3. Architecture

```text
app/
  Events/                  Événements temps réel
  Http/Controllers/        Contrôleurs API
  Http/Requests/            Validation des entrées
  Http/Resources/           Contrats JSON publics
  Models/                   Modèles Eloquent
  Notifications/            Notifications database/broadcast
  Repositories/             Accès aux données et contrats
  Services/                 Logique métier complexe
bootstrap/                  Enregistrement Laravel et routes
config/                     Configuration
 database/migrations/       Structure SQL
routes/v1/                  Routes API versionnées
routes/channels.php         Autorisation des channels privés
tests/Feature/              Tests d'intégration HTTP
tests/Unit/                 Tests unitaires
```

Règles de conception :

1. Les contrôleurs valident, autorisent et formatent la réponse.
2. Les `FormRequest` portent les règles de validation.
3. Les `Resources` définissent le contrat JSON mobile.
4. Les repositories isolent les requêtes importantes.
5. Les services portent les workflows transactionnels et financiers.
6. Les montants restent cohérents avec la devise `XOF`.
7. Les wallets et le séquestre utilisent des transactions SQL.
8. Toute nouvelle route doit être testée.

## 4. URL et authentification

L'API est préfixée par :

```text
/api/v1
```

Les routes protégées utilisent `auth:api` et l'authentification JWT.

Le client envoie :

```http
Authorization: Bearer <token>
Accept: application/json
```

### Inscription

```http
POST /api/v1/auth/register
```

```json
{
  "name": "Awa",
  "last_name": "Test",
  "email": "awa@example.com",
  "phone": "+22990000099",
  "role": "buyer",
  "password": "password"
}
```

Rôles acceptés : `buyer`, `producer`, `transporter`.

### Connexion

```http
POST /api/v1/auth/login
```

```json
{
  "phone": "+22990000099",
  "password": "password"
}
```

### Déconnexion

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

## 5. Fonctionnalité : accueil par rôle

```http
GET /api/v1/home
Authorization: Bearer <token>
```

`HomeController` renvoie les données adaptées au rôle connecté : profil, wallet, produits, commandes actives, statut et position du transporteur.

Un acheteur, un producteur et un transporteur ne doivent pas être supposés recevoir exactement les mêmes blocs JSON.

## 6. Fonctionnalité : produits et catalogue

### Lister

```http
GET /api/v1/products
Authorization: Bearer <token>
```

Un acheteur consulte le catalogue ; un producteur consulte ses produits selon le contrôleur.

### Créer un produit

```http
POST /api/v1/products
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Champs principaux :

```text
name
quantity
unit
price_per_unit
location
stock_proof_photo (optionnel)
```

Seul `producer` est autorisé. Le `producer_id` vient de l'utilisateur authentifié et ne doit pas être fourni aveuglément par le client.

Le flux est : création transactionnelle, broadcast `ProductPublished`, notification `NewProductPublished`, puis réponse `ProductResource`.

### Produits du producteur et détail

```http
GET /api/v1/producer/products
GET /api/v1/products/{id}
Authorization: Bearer <token>
```

## 7. Fonctionnalité : commandes

```http
POST /api/v1/orders
Authorization: Bearer <token>
```

Le flux canonique est `BuyerOrderController` + `BuyerOrderService`.

```json
{
  "product_id": "uuid",
  "quantity_ordered": 2,
  "pickup_latitude": 6.3703,
  "pickup_longitude": 2.3912,
  "delivery_latitude": 6.4,
  "delivery_longitude": 2.45
}
```

Le service :

1. vérifie le produit et la quantité ;
2. calcule les montants côté serveur ;
3. verrouille le wallet de l'acheteur ;
4. vérifie le solde ;
5. débite et crée `escrow_lock` ;
6. crée les codes de collecte et de livraison ;
7. notifie le producteur ;
8. affecte un transporteur ou diffuse une offre.

Statuts SQL de `orders` :

```text
pending_payment
paid_searching_driver
assigned_to_driver
collected
delivered
disputed
```

### Lister et afficher les commandes

```http
GET /api/v1/orders
GET /api/v1/orders/{id}
Authorization: Bearer <token>
```

### Déclarer un litige

```http
POST /api/v1/orders/{id}/dispute
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Le service vérifie la propriété de la commande, le statut compatible et les données du litige.

## 8. Fonctionnalité : transport et trajets

### Publier un trajet

```http
POST /api/v1/trips
Authorization: Bearer <token>
```

```json
{
  "departure_city": "Abomey",
  "destination_city": "Cotonou",
  "available_weight": 100,
  "departure_date": "2026-09-05 10:00:00"
}
```

Seul `transporter` est autorisé. Le backend ajoute `transporter_id` et initialise `status` à `scheduled`.

### Lister ses trajets

```http
GET /api/v1/trips
Authorization: Bearer <token>
```

### Publier sa position et sa disponibilité

```http
POST /api/v1/driver/ping
Authorization: Bearer <token>
```

```json
{
  "latitude": 6.3703,
  "longitude": 2.3912,
  "status": "available"
}
```

Statuts de chauffeur : `available`, `busy`, `offline`.

### Accepter une commande

```http
POST /api/v1/orders/assign
Authorization: Bearer <token>
```

Le matching utilise les profils disponibles et la proximité géographique.

## 9. Fonctionnalité : tracking GPS

### Ajouter une position

```http
POST /api/v1/orders/{id}/tracking
Authorization: Bearer <token>
```

```json
{
  "latitude": 6.37,
  "longitude": 2.39,
  "current_city": "Cotonou"
}
```

Seul le transporteur affecté peut envoyer une position. Chaque position déclenche `DriverLocationUpdated` vers l'acheteur.

### Synchroniser plusieurs positions

```http
POST /api/v1/orders/{id}/tracking/batch
Authorization: Bearer <token>
```

```json
{
  "locations": [
    {
      "latitude": 6.38,
      "longitude": 2.40,
      "current_city": "Cotonou",
      "timestamp": "2026-09-05 10:30:00"
    }
  ]
}
```

`created_at` est autorisé dans `OrderTracking` afin de préserver l'ordre réel des points hors ligne.

### Consulter le suivi

```http
GET /api/v1/orders/{id}/tracking
Authorization: Bearer <token>
```

La réponse contient l'origine, la destination, la position actuelle et `full_itinerary`.

## 10. Fonctionnalité : collecte, livraison et séquestre

### Valider la collecte

```http
POST /api/v1/orders/{id}/validate-collection
Authorization: Bearer <token>
```

Le transporteur envoie le code de collecte et la quantité récupérée. Un écart important peut placer la commande en `disputed`.

### Valider la livraison

```http
POST /api/v1/orders/{id}/validate-delivery
Authorization: Bearer <token>
```

L'acheteur envoie le code de livraison. Le service vérifie l'acheteur, le statut `collected`, le code, le producteur, le transporteur et les montants.

Après validation :

- la commande passe à `delivered` ;
- le producteur reçoit son montant net ;
- le transporteur reçoit les frais de livraison ;
- les transactions sont enregistrées ;
- `OrderDelivered` est broadcasté.

## 11. Fonctionnalité : wallet et Mobile Money

### Résumé wallet

```http
GET /api/v1/balance
Authorization: Bearer <token>
```

Réponse : `balance`, `currency`, `user_role`, `escrow.total_amount`, `escrow.active_orders`, `recent_transactions`.

### Dépôt interne ou test

```http
POST /api/v1/deposit
Authorization: Bearer <token>
```

```json
{
  "amount": 5000,
  "transaction_reference": "DEP-unique-reference"
}
```

Cette route historique crédite le wallet avec une référence fournie par le client. Elle ne doit pas être utilisée comme preuve de paiement en production ; utiliser le flux MoMo vérifié ou la supprimer.

### Top-up Mobile Money

```http
POST /api/v1/wallet/topup
GET /api/v1/wallet/topup/{reference}/status
```

Le flux mobile initie l'opération puis interroge le statut jusqu'à `successful` ou `failed`.

### Retrait Mobile Money

```http
POST /api/v1/wallet/withdraw
GET /api/v1/wallet/withdraw/{reference}/status
```

Les secrets et credentials des fournisseurs ne doivent jamais être écrits dans le code, les logs ou les tests.

## 12. Fonctionnalité : notifications

```http
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
GET    /api/v1/notifications/{id}
PATCH  /api/v1/notifications/{id}/read
PATCH  /api/v1/notifications/read-all
DELETE /api/v1/notifications/{id}
DELETE /api/v1/notifications
```

Les notifications sont persistées dans `notifications` et certaines sont diffusées en temps réel.

Types utilisés dans les payloads : `product.created`, `order.created`, `order_placed` et les événements de livraison/tracking.

## 13. Fonctionnalité : broadcasting et channels

Les événements sont dans `app/Events/` et les autorisations dans `routes/channels.php`.

| Channel | Autorisation | Usage |
|---|---|---|
| `App.Models.User.{id}` | UUID de l'utilisateur connecté | notifications personnelles |
| `marketplace.buyers` | rôle `buyer` | nouveaux produits |
| `user.{id}` | UUID de l'utilisateur connecté | notifications producteur |
| `drivers.zone.{zone}` | rôle `transporter` | offres par zone |

Événements principaux :

- `ProductPublished` → `product.created` ;
- `OrderPlacedForProducer` → `order.placed` ;
- `OrderAvailableForDrivers` → `order.available` ;
- `OrderCollected` → `order.collected` ;
- `OrderDelivered` → `order.delivered` ;
- `DriverLocationUpdated` → `driver.location_updated`.

Un événement avec `broadcastOn()` doit implémenter `ShouldBroadcast` ou `ShouldBroadcastNow`.

## 14. Base de données et modèles

Modèles principaux :

- `User` : identité, rôle, statut et notifications ;
- `Product` : produit publié ;
- `Order` : commande, montants, codes et statuts ;
- `OrderTracking` : positions GPS ;
- `Trip` : trajet transporteur ;
- `Wallet` : solde ;
- `WalletTransaction` : historique financier ;
- `DriverProfile` : disponibilité et position.

Les identifiants utilisent généralement des UUID via `HasUuids`. Ne jamais les caster en entier dans les channels ou les requêtes.

Utiliser `loadMissing()` ou un chargement explicite lorsqu'une relation est nécessaire à un événement ou une ressource.

## 15. Tests et qualité

Tests actuels :

```text
tests/Feature/ApiCoverageTest.php
tests/Feature/BroadcastingAndApiTest.php
tests/Feature/BuyerProducerWorkflowTest.php
tests/Feature/TransportWorkflowTest.php
tests/Feature/ExampleTest.php
tests/Unit/ExampleTest.php
```

Les tests feature utilisent `RefreshDatabase`, les routes HTTP réelles et des utilisateurs authentifiés par JWT.

Pour chaque nouvelle fonctionnalité, tester :

1. la route sans authentification ;
2. le rôle autorisé ;
3. les rôles interdits ;
4. la validation ;
5. la persistance ;
6. le JSON ;
7. les notifications et événements ;
8. l'erreur métier.

Avant une pull request :

```bash
php artisan test
php artisan route:list --path=api/v1
php artisan config:clear
git diff --check
```

## 16. Ajouter une fonctionnalité : méthode de travail

### Étape 1 — Contrat

Définir route, rôle, entrées, sortie JSON et erreurs.

### Étape 2 — Migration

Ajouter colonnes, types, index, clés étrangères et valeurs par défaut. Utiliser des UUID pour les relations métier existantes.

### Étape 3 — Modèle

Mettre à jour `$fillable`, `$casts` et les relations. Vérifier qu'un champ batch comme `created_at` n'est pas ignoré.

### Étape 4 — Validation

Créer un `FormRequest` dans `app/Http/Requests`.

### Étape 5 — Logique métier

Mettre les workflows transactionnels dans un service. Utiliser `DB::transaction()` et des verrous pour les soldes et statuts concurrents.

### Étape 6 — Route et resource

Ajouter la route dans `routes/v1/` et utiliser une `JsonResource` pour un contrat partagé avec le mobile.

### Étape 7 — Événements

Si le mobile doit réagir immédiatement, ajouter un événement broadcastable, son `broadcastAs()` et son test de channel.

### Étape 8 — Tests

Tester succès, rôles interdits, validation, base et effets secondaires.

### Étape 9 — Vérification Docker

```bash
docker compose exec laravel.test php artisan migrate:fresh --env=testing
docker compose exec laravel.test php artisan test
```

## 17. Pièges connus

- Ne pas utiliser `auth:sanctum` pour les routes JWT `auth:api`.
- Ne pas accepter aveuglément les IDs de rôles depuis le client.
- Ne pas calculer le prix final uniquement dans l'application mobile.
- Ne pas caster un UUID en entier.
- Ne pas oublier `ShouldBroadcast`.
- Ne pas remplacer l'horodatage client d'un tracking batch par l'heure serveur.
- Ne pas mettre les secrets Mobile Money dans Git.
- Ne pas lancer `migrate:fresh` sur une base non destinée aux tests.
- Toujours limiter les notifications à l'utilisateur connecté.
- Toujours vérifier le rôle et l'état précédent avant un changement de commande.

## 18. Routes utilitaires et documentation

Lister les routes :

```bash
php artisan route:list --path=api/v1
```

Une route technique `/api/test-momo` teste le contact MTN MoMo. Elle doit être protégée ou retirée en production.

Scramble est installé pour générer une documentation API à partir des routes et contrôleurs. Vérifier `config/scramble.php` avant de publier une documentation externe.

## 19. Prochaines améliorations recommandées

Priorité haute :

1. ajouter des tests email si des Mailables sont introduits ;
2. documenter et sécuriser les callbacks Mobile Money ;
3. protéger ou supprimer la route de test MoMo ;
4. ajouter un endpoint public de liste d'attente pour la landing ;
5. vérifier les autorisations métier de chaque route ;
6. brancher une queue persistante en production.

Priorité moyenne :

1. compléter les factories Product, Order, Trip et Wallet ;
2. ajouter des tests de concurrence sur le séquestre ;
3. uniformiser les types de notifications ;
4. documenter les erreurs JSON ;
5. ajouter des logs structurés sans données sensibles.

## 20. État de référence

Au 4 septembre 2026 :

- backend Laravel fonctionnel ;
- API versionnée sous `/api/v1` ;
- authentification JWT fonctionnelle ;
- produits, commandes, wallets et tracking couverts ;
- broadcasts et channels privés testés ;
- suite : **19 tests passés, 77 assertions** ;
- MySQL et Laravel exécutables avec Docker Compose ;
- application mobile Expo et landing Next.js présentes dans les dossiers voisins.

Le prochain développeur doit lire les tests feature avant de modifier un workflow financier, puis relancer la suite complète dans le conteneur Laravel.
