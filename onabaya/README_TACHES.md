# Onabaya - suivi des taches

Ce fichier sert au suivi quotidien du developpement mobile. Le detail complet de l'audit se trouve dans [AUDIT_ACTIONS_SECURITE.md](AUDIT_ACTIONS_SECURITE.md).

## Regles

- `P0` : bloque la compilation, la securite ou un parcours critique.
- `P1` : fonctionnalite importante non terminee ou risque eleve.
- `P2` : qualite, ergonomie, tests ou robustesse.
- Une tache ne passe a terminee qu'apres verification et test.
- Les montants TTC doivent etre calcules et confirmes par le backend avant affichage mobile.

## Convention Git par feature

Le backend et le mobile vivent dans le meme depot. Chaque feature mobile doit donc etre liee a un ticket et nommee de la meme facon que son ticket backend.

Format de branche : `type/domaine-ticket-description`

Types : `feat`, `fix`, `security`, `test`, `docs`, `chore`.

Exemples :

```text
fix/mobile-MOB-P0-001-typescript
fix/mobile-MOB-P0-002-routes-expo
security/mobile-SEC-P0-001-remove-sensitive-logs
feat/mobile-TAX-MOB-P0-003-display-ttc
feat/mobile-BUY-P1-001-order-flow
feat/mobile-DRIVER-P1-001-driver-status
test/mobile-TEST-P1-001-critical-flows
```

Regles :

- une branche correspond a un ticket ou a des tickets explicitement dependants ;
- noms en minuscules, sans espace ni accent ;
- ne pas melanger backend, mobile et documentation sans lien direct ;
- utiliser le meme identifiant de ticket dans le nom de branche, le commit et la PR ;
- une feature TTC partagee utilise deux branches liees : `feat/backend-TAX-BE-P0-002-calculate-ttc` et `feat/mobile-TAX-MOB-P0-003-display-ttc`.

Format de commit : `type(scope): action courte [TICKET]`.

```text
fix(routes): replace legacy navigation [MOB-P0-002]
feat(tax): display HT tax and TTC [TAX-MOB-P0-003]
security(auth): remove password logs [SEC-P0-001]
test(orders): cover QR delivery flow [TEST-P1-001]
```

Titre de PR : `[TAX-MOB-P0-003] Display official TTC amounts`.

La PR doit indiquer le ticket, les fichiers modifies, les tests executes, la dependance backend et les risques restants.

## Sprint 0 - bloquants et securite

### MOB-P0-001 - Reparer la compilation

- [ ] Corriger les erreurs TypeScript dans carte, detail commande, notifications, wallet et produits.
- [ ] Corriger les erreurs ESLint.
- [ ] Remplacer les SafeAreaView incorrects.
- [ ] Retirer les casts `any` qui masquent les erreurs de contrat.
- [ ] Verification : `pnpm exec tsc --noEmit` et `pnpm lint` passent.

### MOB-P0-002 - Corriger les routes

- [ ] Corriger les navigations React Navigation restantes.
- [ ] Corriger la route de suivi de commande.
- [ ] Corriger la route de creation produit.
- [ ] Creer ou retirer les onglets transporteur `trajects` et `status`.
- [ ] Creer ou retirer l'ecran `RecurringOrders`.
- [ ] Supprimer le fichier de notification duplique.
- [ ] Verification : tous les boutons de navigation ouvrent un ecran existant.

### SEC-P0-001 - Proteger les donnees sensibles

- [ ] Supprimer les logs de formulaire contenant mot de passe.
- [ ] Supprimer les payloads complets d'authentification, wallet et paiement.
- [ ] Remplacer AsyncStorage pour le JWT par un stockage securise.
- [ ] Ajouter expiration, nettoyage et gestion globale des HTTP 401.
- [ ] Ajouter une garde d'authentification au demarrage.
- [ ] Verification : aucune donnee sensible n'apparait dans les logs de production.

### SEC-P0-002 - Fermer les routes de test

- [ ] Supprimer ou proteger `POST /test-momo`.
- [ ] Verifier les routes debug et sandbox avant release.
- [ ] Ajouter un test d'acces sans authentification.
- [ ] Verification : les routes de test sont absentes ou reservees a un role admin.

## Sprint 1 - contrat prix, taxes et TTC

### TAX-P0-001 - Valider le contrat backend

- [ ] Confirmer les champs definitifs : `subtotal_ht`, `tax_rate`, `tax_amount`, `total_ttc` ou equivalents.
- [ ] Confirmer si la taxe concerne le produit, la commande, la livraison ou tous les montants.
- [ ] Documenter formule, devise XOF et regle d'arrondi.
- [ ] Verifier migrations, Resources, services, notifications, wallet et Reverb.
- [ ] Verification : un exemple JSON backend couvre HT, taxe, frais et TTC.

### TAX-P0-002 - Propager le TTC dans l'API

- [ ] Ajouter le TTC aux produits et commandes.
- [ ] Propager le TTC dans home, detail, historique, wallet et notifications.
- [ ] Definir la signification de `total_price` pendant la migration.
- [ ] Recalculer les montants cote serveur, sans confiance dans le mobile.
- [ ] Verification : la meme commande renvoie les memes montants dans toutes les Resources.

### TAX-P0-003 - Afficher le TTC dans le mobile

- [ ] Ajouter les champs TTC aux types, providers et slices.
- [ ] Afficher `HT`, `Taxe`, `Frais de livraison` et `TTC` dans le parcours acheteur.
- [ ] Mettre a jour cartes produit, carte, confirmation, detail commande, wallet et notifications.
- [ ] Afficher au producteur son gain net et au transporteur sa remuneration selon la regle metier.
- [ ] Verification : le total affiche avant paiement est identique au total API final.

## Sprint 2 - parcours metier

### BUY-P1-001 - Finaliser le parcours acheteur

- [ ] Corriger calcul et saisie des frais de livraison.
- [ ] Ajouter adresse ou position de livraison validee.
- [ ] Finaliser paiement wallet et Mobile Money.
- [ ] Gerer stock insuffisant, solde insuffisant, timeout et `order_id` absent.
- [ ] Finaliser suivi GPS, confirmation livraison, annulation et litige.
- [ ] Verification : commande de bout en bout avec paiement et TTC.

### PROD-P1-001 - Finaliser le parcours producteur

- [ ] Implementer modification et suppression produit.
- [ ] Afficher les vraies photos de stock.
- [ ] Finaliser commandes, recherche, refresh et erreurs.
- [ ] Afficher correctement HT, taxe, TTC acheteur et gain net.
- [ ] Verification : publication puis reception d'une commande par notification.

### DRIVER-P1-001 - Finaliser le parcours transporteur

- [ ] Persister le statut chauffeur cote API.
- [ ] Utiliser `POST /driver/ping` avec consentement GPS.
- [ ] Finaliser acceptation, concurrence, collecte QR et livraison QR.
- [ ] Implementer trajets et historique ou retirer les onglets incomplets.
- [ ] Verification : deux chauffeurs ne peuvent pas accepter la meme course.

### WALLET-P1-001 - Finaliser wallet et MoMo

- [ ] Brancher Retirer et Historiques des wallets producteur et transporteur.
- [ ] Gerer `pending`, `successful`, `failed`, timeout et reprise.
- [ ] Arreter le polling au demontage et eviter les doubles operations.
- [ ] Afficher sequestre, transactions et TTC de maniere coherente.
- [ ] Verification : une transaction ne peut etre creditee ou debitee deux fois.

### ACCOUNT-P1-001 - Finaliser le compte

- [ ] Implementer deconnexion dans les trois roles.
- [ ] Implementer modification profil.
- [ ] Implementer verification identite.
- [ ] Implementer changement mot de passe.
- [ ] Implementer preferences notifications.
- [ ] Verification : chaque bouton visible possede une action, un loader et une erreur.

### NOTIF-P1-001 - Finaliser notifications

- [ ] Corriger pagination, lecture, suppression et doublons.
- [ ] Corriger navigation vers les details.
- [ ] Verifier les types emis par Laravel.
- [ ] Propager les montants TTC dans les notifications concernées.
- [ ] Verification : une notification temps reel ouvre le bon ecran.

### LOYAL-P1-001 - Finaliser fidelite

- [ ] Implementer liste et gestion des commandes recurrentes.
- [ ] Ajouter activation, pause, reprise et annulation.
- [ ] Valider stock, adresse, frequence, solde et TTC.
- [ ] Verification : une commande programmee peut etre creee puis annulee.

## Sprint 3 - qualite et release

### QA-P2-001 - Stabiliser les interfaces

- [ ] Ajouter loading, erreur, empty state, retry et refresh a chaque liste.
- [ ] Gerer hors ligne, reprise et absence de GPS.
- [ ] Corriger textes longs, clavier, safe areas et petits ecrans.
- [ ] Ajouter accessibilite et Error Boundary.
- [ ] Verification : aucun ecran vide ou bouton sans retour utilisateur.

### TEST-P1-001 - Ajouter les tests critiques

- [ ] Login, inscription, session expiree et deconnexion.
- [ ] Produit avec photo, modification et suppression.
- [ ] Commande avec stock, solde, taxes, TTC et paiement.
- [ ] QR collecte, QR livraison, litige et permissions camera.
- [ ] MoMo, notifications, statut chauffeur et concurrence.
- [ ] Verification : les tests sont reproductibles en local et en CI.

### CI-P1-001 - Bloquer les regressions

- [ ] Executer `pnpm exec tsc --noEmit`.
- [ ] Executer `pnpm lint`.
- [ ] Executer `docker compose exec laravel.test php artisan test` depuis `agricultural`.
- [ ] Executer l'export/build Expo Android et verifier les routes.
- [ ] Verification : aucun merge ne passe avec un controle en echec.

## Definition de fini

- [ ] Tous les tickets P0 sont fermes.
- [ ] Le contrat TTC backend et mobile est identique et documente.
- [ ] Aucun mot de passe, token ou payload sensible n'est logge.
- [ ] Tous les roles buyer, producer et transporter sont testes.
- [ ] Tous les boutons visibles ont un comportement implemente.
- [ ] TypeScript, lint, tests backend et build Expo passent.
