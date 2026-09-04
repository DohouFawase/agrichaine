# Onabaya — Fiche projet et brief de landing page

Version : 4 septembre 2026  
Langues : français et anglais  
Produit : application mobile + API Laravel + landing page Next.js

---

# 1. Brief en français

## 1.1 Résumé du projet

**Onabaya** est une marketplace agricole mobile qui met directement en relation trois acteurs du commerce vivrier :

- les **producteurs**, qui publient et vendent leurs récoltes ;
- les **acheteurs**, qui découvrent et commandent des produits agricoles ;
- les **transporteurs**, qui acceptent et suivent les livraisons.

L’objectif est de rendre le commerce agricole plus direct, plus transparent et plus fiable, en réduisant les intermédiaires et en donnant à chaque acteur une visibilité sur sa commande, son paiement et sa livraison.

## 1.2 Proposition de valeur

> **Onabaya relie le champ au panier, avec un paiement sécurisé et une livraison traçable.**

Le produit répond à trois problèmes :

1. Les producteurs vendent parfois à bas prix faute d’acheteurs fiables.
2. Les acheteurs paient plus cher et manquent de visibilité sur l’origine, le prix et la livraison.
3. Les transporteurs circulent parfois sans optimiser leur capacité disponible.

Onabaya crée un circuit plus court : le producteur publie, l’acheteur commande, le transporteur livre, et le système suit les étapes.

## 1.3 Publics cibles

### Producteur

Profil : agriculteur, coopérative ou vendeur de produits vivriers.

Bénéfices à montrer :

- publier un produit avec quantité, unité, prix et localisation ;
- recevoir des commandes directement ;
- protéger son paiement grâce au séquestre ;
- voir les commandes et les notifications en temps réel ;
- améliorer sa réputation grâce aux évaluations.

Message possible :

> **Vendez votre récolte au bon prix, directement aux acheteurs.**

### Acheteur

Profil : commerçant, restaurateur, ménage ou client qui achète des produits agricoles.

Bénéfices à montrer :

- parcourir les produits disponibles ;
- commander selon la quantité souhaitée ;
- payer en XOF avec Mobile Money ou wallet ;
- suivre le transporteur sur une carte ;
- confirmer la livraison avec un code ou un QR code ;
- être protégé en cas de litige.

Message possible :

> **Trouvez des produits frais, commandez simplement et suivez votre livraison.**

### Transporteur

Profil : chauffeur indépendant ou opérateur de transport.

Bénéfices à montrer :

- voir les livraisons disponibles dans une zone ;
- accepter une course adaptée à son trajet ;
- déclarer ses trajets, villes et capacité disponible ;
- partager sa position pendant la livraison ;
- recevoir les frais de livraison après confirmation.

Message possible :

> **Transformez vos trajets en opportunités de livraison.**

## 1.4 Fonctionnalités réellement présentes dans le produit

### Marketplace

- création de produits par les producteurs ;
- catalogue de produits disponibles ;
- informations produit : nom, quantité, unité, prix, localisation et producteur ;
- commande par l’acheteur.

### Paiement et wallet

- portefeuille en devise XOF ;
- dépôt et retrait via les flux Mobile Money configurés ;
- montant de la commande placé en séquestre ;
- libération des montants après validation de la livraison ;
- historique des transactions ;
- séparation des gains producteur et transporteur.

### Livraison et suivi

- attribution d’un transporteur disponible ;
- suivi de latitude, longitude et ville ;
- synchronisation de positions en mode batch ;
- affichage de l’itinéraire ;
- suivi de la commande jusqu’à la livraison.

### Vérification et confiance

- code de collecte ;
- code de livraison ;
- validation QR prévue dans le parcours mobile ;
- possibilité de déclarer un litige ;
- profils, rôles et évaluations ;
- autorisations distinctes pour acheteur, producteur et transporteur.

### Notifications temps réel

- nouveau produit publié ;
- nouvelle commande reçue ;
- commande disponible pour les transporteurs ;
- position du transporteur ;
- collecte et livraison ;
- notifications persistées dans l’application.

## 1.5 Ton de marque

Le ton doit être :

- direct et humain ;
- rassurant sans être institutionnel ;
- concret, avec des bénéfices compréhensibles ;
- ancré dans le terrain et les réalités du commerce africain ;
- ambitieux, mais jamais exagéré.

Éviter :

- le vocabulaire trop technique ;
- les promesses de livraison instantanée ;
- les chiffres non vérifiés ;
- les images agricoles génériques qui ne montrent pas le produit réel ;
- un ton qui présente les producteurs comme de simples fournisseurs anonymes.

## 1.6 Direction artistique recommandée

### Impression générale

Une identité **agricole contemporaine**, chaleureuse et utile : la terre, les produits, les personnes et la logistique doivent être visibles ensemble.

La landing ne doit pas ressembler à un simple site SaaS abstrait. Elle doit évoquer un marché réel, une chaîne de confiance et un usage mobile quotidien.

### Palette de départ

Utiliser une palette multi-acteurs, déjà cohérente avec l’application mobile :

- vert producteur : `#2E9E5B` ;
- bleu acheteur : `#2F6FED` ;
- orange transporteur : `#E8863C` ;
- jaune accent / paiement : `#FFC849` ;
- fond clair chaud : `#F8F7F4` ;
- texte profond : `#173326`.

Le vert doit être la couleur de marque principale, mais ne pas monopoliser toute l’interface. Le bleu et l’orange servent à distinguer les rôles.

### Typographie

Choisir une police expressive pour les titres et une police très lisible pour le corps. La typographie doit fonctionner en français et en anglais, avec des titres courts, solides et humains.

Éviter les titres entièrement en majuscules et les effets technologiques trop froids.

### Images

Priorité aux images réelles ou aux visuels qui montrent :

- un producteur avec sa récolte ;
- des produits agricoles identifiables ;
- un acheteur ou commerçant qui choisit des produits ;
- un transporteur et un véhicule en situation ;
- un téléphone affichant une carte ou une commande.

Ne pas utiliser uniquement des champs flous ou des photos de banque d’images sans lien avec l’usage.

## 1.7 Structure recommandée de la landing page

### 1. Header

- logo Onabaya ;
- navigation courte : Fonctionnement, Pour qui, Sécurité, FAQ ;
- sélecteur FR / EN ;
- bouton principal : **Rejoindre la liste d’attente**.

### 2. Hero

Objectif : comprendre Onabaya en moins de cinq secondes.

Titre recommandé :

> **Du champ à votre panier, sans détour.**

Sous-titre :

> Onabaya connecte producteurs, acheteurs et transporteurs pour rendre le commerce vivrier plus simple, plus sûr et plus transparent.

Actions :

- **Rejoindre la liste d’attente** ;
- **Découvrir comment ça marche**.

Visuel : composition montrant un produit agricole réel, un téléphone avec le suivi de livraison et les trois rôles reliés par un même parcours.

### 3. Le problème

Présenter trois situations courtes :

- récoltes difficiles à écouler ;
- prix et fraîcheur difficiles à contrôler ;
- livraisons sans visibilité.

Formule possible :

> **Quand le lien entre le champ et le client est flou, tout le monde perd du temps et de la valeur.**

### 4. La solution

Présenter Onabaya comme un réseau simple :

**Publier → Commander → Transporter → Confirmer**

Cette section doit être visuelle, avec une ligne de parcours ou une carte simplifiée, pas un long paragraphe.

### 5. Les trois rôles

Créer trois blocs distincts, avec les couleurs de rôle :

- Producteur : publier et vendre ;
- Acheteur : choisir et commander ;
- Transporteur : livrer et gagner.

Chaque bloc doit contenir une image réelle, une phrase de bénéfice et un lien d’action.

### 6. Les garanties

Mettre en avant quatre preuves concrètes :

- paiement protégé par séquestre ;
- suivi de livraison ;
- validation par code / QR ;
- notifications à chaque étape.

### 7. Le parcours d’une commande

Illustrer un exemple complet :

1. Un producteur publie des tomates.
2. Un acheteur choisit une quantité.
3. Le montant est sécurisé en XOF.
4. Un transporteur accepte la livraison.
5. La position est suivie sur la carte.
6. La remise est confirmée.
7. Les fonds sont libérés.

### 8. Appel à l’action

La landing actuelle prévoit une liste d’attente. L’interface peut demander :

- nom ;
- email ;
- rôle ;
- ville.

Texte recommandé :

> **Faites partie des premiers utilisateurs d’Onabaya.**

Important : l’API Laravel actuelle ne contient pas encore de route publique dédiée à la liste d’attente. Le formulaire doit donc être présenté comme une inscription de pré-lancement tant que son branchement backend n’est pas réalisé.

### 9. FAQ

Questions utiles :

- À qui s’adresse Onabaya ?
- L’application est-elle gratuite au lancement ?
- Comment fonctionne le paiement ?
- Que se passe-t-il en cas de problème de livraison ?
- Quand l’application sera-t-elle disponible ?
- Où sont utilisées les données d’inscription ?

### 10. Footer

- logo ;
- phrase courte de marque ;
- liens légaux ;
- contact ;
- réseaux sociaux si disponibles ;
- changement de langue.

## 1.8 Contraintes UX et responsive

- La proposition de valeur doit être visible dès le premier écran sur mobile et desktop.
- Le premier écran doit laisser apparaître un indice de la section suivante.
- Les boutons principaux doivent avoir une icône claire et un libellé court.
- Les cartes ne doivent pas être empilées dans d’autres cartes.
- Les sections doivent rester aérées et faciles à parcourir.
- Prévoir un état succès, erreur et chargement pour le formulaire.
- Prévoir une navigation mobile simple avec un menu accessible.
- Le contenu doit être traduit, pas seulement remplacé mot à mot.
- Tester au minimum les largeurs 375 px, 768 px et 1440 px.

## 1.9 Critères de réussite

La landing est réussie si un visiteur peut répondre immédiatement à ces questions :

1. Qu’est-ce qu’Onabaya ?
2. Quel est mon rôle dans l’écosystème ?
3. Pourquoi puis-je faire confiance au service ?
4. Que dois-je faire maintenant ?

La conversion principale est l’inscription à la liste d’attente. La conversion secondaire est la découverte du fonctionnement par rôle.

---

# 2. English brief

## 2.1 Project summary

**Onabaya** is a mobile agricultural marketplace connecting three participants in the food supply chain:

- **producers**, who list and sell their harvests;
- **buyers**, who discover and order agricultural products;
- **transporters**, who accept and track deliveries.

The goal is to make agricultural trade more direct, transparent and reliable by reducing unnecessary middlemen and giving every participant visibility over orders, payments and deliveries.

## 2.2 Value proposition

> **Onabaya connects the field to the basket, with protected payments and trackable delivery.**

The product addresses three problems:

1. Producers may sell below value because reliable buyers are difficult to reach.
2. Buyers often pay more while lacking visibility into product origin, price and delivery.
3. Transporters may travel with unused capacity and miss relevant delivery opportunities.

Onabaya creates a clearer flow: the producer lists, the buyer orders, the transporter delivers, and the platform tracks the journey.

## 2.3 Target audiences

### Producer

A farmer, cooperative or agricultural seller.

Show these benefits:

- list products with quantity, unit, price and location;
- receive orders directly;
- protect payment through escrow;
- manage orders and real-time notifications;
- build trust through ratings.

Suggested message:

> **Sell your harvest at a fair price, directly to buyers.**

### Buyer

A retailer, restaurant, household or customer purchasing agricultural goods.

Show these benefits:

- browse available products;
- order the desired quantity;
- pay in XOF through Mobile Money or wallet;
- follow the transporter on a map;
- confirm delivery with a code or QR flow;
- get support when a dispute occurs.

Suggested message:

> **Find fresh products, order easily and follow your delivery.**

### Transporter

An independent driver or logistics operator.

Show these benefits:

- view delivery opportunities by zone;
- accept a delivery that matches the route;
- publish route, cities and available capacity;
- share location while delivering;
- receive delivery fees after confirmation.

Suggested message:

> **Turn your routes into delivery opportunities.**

## 2.4 Product capabilities already implemented

### Marketplace

- producers can create products;
- buyers can browse available products;
- product data includes name, quantity, unit, price, location and producer;
- buyers can create orders.

### Payments and wallet

- wallet in XOF;
- Mobile Money top-up and withdrawal flows are configured;
- order funds are held in escrow;
- funds are released after delivery confirmation;
- transaction history is available;
- producer and transporter earnings are separated.

### Delivery and tracking

- available transporters can be assigned to orders;
- GPS latitude, longitude and city updates are stored;
- tracking points can be synchronized in batches;
- the buyer can view the route;
- the order is followed through delivery.

### Trust and verification

- collection code;
- delivery code;
- QR verification flow in the mobile experience;
- dispute reporting;
- role-based profiles and ratings;
- separate permissions for buyers, producers and transporters.

### Real-time notifications

- new product published;
- new order received;
- delivery opportunity for transporters;
- transporter location update;
- collection and delivery events;
- notifications persisted inside the application.

## 2.5 Brand tone

The brand should feel:

- direct and human;
- reassuring without being corporate;
- concrete and benefit-led;
- rooted in real African agricultural commerce;
- ambitious without making unsupported claims.

Avoid technical language, guaranteed delivery claims, invented metrics, generic agricultural stock imagery and messaging that treats producers as anonymous suppliers.

## 2.6 Visual direction

Create a **contemporary agricultural identity** that combines land, products, people and logistics. The landing page should feel like a real marketplace and a trusted operating network, not an abstract SaaS dashboard.

Suggested application-aligned colors:

- producer green: `#2E9E5B`;
- buyer blue: `#2F6FED`;
- transporter orange: `#E8863C`;
- payment yellow: `#FFC849`;
- warm light background: `#F8F7F4`;
- deep text: `#173326`.

Green is the primary brand color, while blue and orange distinguish user roles. Use real or product-specific imagery: harvests, buyers, drivers, mobile order screens and delivery maps.

## 2.7 Landing page structure

1. **Header**: Onabaya logo, short navigation, FR/EN switcher and waitlist CTA.
2. **Hero**: explain the product in five seconds with a real agricultural and mobile tracking visual.
3. **The problem**: unsold harvests, unclear pricing and invisible deliveries.
4. **The solution**: List → Order → Transport → Confirm.
5. **Three roles**: producer, buyer and transporter, each with its own benefit and color.
6. **Trust layer**: escrow, tracking, QR/code confirmation and notifications.
7. **Order journey**: a complete example from listing to payout.
8. **Waitlist CTA**: name, email, role and city.
9. **FAQ**: audience, payment, delivery issues, launch timing and data use.
10. **Footer**: brand, legal links, contact, social links and language switcher.

Suggested hero headline:

> **From the field to your basket, without the detour.**

Suggested supporting copy:

> Onabaya connects producers, buyers and transporters to make agricultural trade simpler, safer and more transparent.

Suggested primary CTA:

> **Join the waitlist**

Important product note: the current Laravel API does not yet expose a dedicated public waitlist endpoint. The waitlist form should be treated as a pre-launch interface until that backend connection is implemented.

## 2.8 UX and responsive requirements

- Make the value proposition visible in the first viewport on mobile and desktop.
- Let the next section peek into the first viewport.
- Use clear icon-plus-label actions for unfamiliar controls.
- Keep page sections unframed and avoid nested cards.
- Include loading, success and error states for the waitlist form.
- Provide a simple accessible mobile navigation.
- Translate meaningfully between French and English instead of translating word by word.
- Test at 375 px, 768 px and 1440 px widths.

## 2.9 Success criteria

A visitor should immediately understand:

1. What is Onabaya?
2. Which role matches me?
3. Why should I trust it?
4. What should I do next?

The primary conversion is waitlist signup. The secondary conversion is exploring the product workflow for a specific role.

---

# 3. Backend reference for the designer and landing developer

## Main applications

- `agricultural/` — Laravel API and business backend.
- `onabaya/` — Expo React Native mobile application.
- `applandingpage/` — Next.js landing page.

## Main backend API groups

Base URL in the mobile app: `/api/v1`.

- Authentication: `/auth/register`, `/auth/login`, `/auth/logout`.
- Products: `GET /products`, `POST /products`, `GET /products/{id}`.
- Orders: `POST /orders`, `GET /orders`, `GET /orders/{id}`.
- Tracking: `GET /orders/{id}/tracking`, `POST /orders/{id}/tracking`, `POST /orders/{id}/tracking/batch`.
- Delivery validation: `/orders/{id}/validate-collection`, `/orders/{id}/validate-delivery`.
- Notifications: `/notifications`, `/notifications/unread-count`, `/notifications/{id}`.
- Wallet: `/balance`, `/deposit`, wallet top-up and withdrawal status routes.
- Trips: `GET /trips`, `POST /trips`.

Most application routes require JWT authentication with the `api` guard.

## Technical stack

- Laravel API, Eloquent and MySQL.
- Laravel broadcasting with Reverb-compatible channels.
- JWT authentication.
- Next.js, React and TypeScript for the landing page.
- Expo, React Native and TypeScript for the mobile application.
- XOF as the main currency in the current product flows.

## Current verification status

The backend test suite currently passes with:

- 19 tests;
- 77 assertions;
- 0 failures.

The tested areas include authentication, API authorization, wallets, products, tracking, broadcasting channels, producer workflows and transporter workflows.

## Files to use as product references

- Backend routes: `agricultural/routes/v1/`.
- Broadcast channels: `agricultural/routes/channels.php`.
- Mobile role colors: `onabaya/hooks/theme.ts`.
- Mobile role selection: `onabaya/app/(auth)/rolePickerScreen.tsx`.
- Existing landing sections: `applandingpage/components/ux/`.

## Open product decisions before launch

- Connect the waitlist form to a real backend or newsletter service.
- Confirm final Onabaya logo and visual identity.
- Confirm launch geography and supported cities.
- Confirm exact Mobile Money providers and production payment status.
- Confirm legal pages and privacy wording.
- Replace placeholder landing images with approved product photography or screenshots.
- Add an app download link when the mobile release is public.
