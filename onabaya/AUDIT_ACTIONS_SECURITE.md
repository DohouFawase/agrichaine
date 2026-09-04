# Audit Onabaya - actions, manques et securite

Date : 2026-09-04
Perimetre : application mobile `onabaya` et contrats API Laravel `agricultural`
Statut : audit realise, aucune correction appliquee dans ce document

## Format des tickets

- `P0` : compilation, securite ou parcours critique bloque.
- `P1` : fonctionnalite importante non terminee ou risque eleve.
- `P2` : qualite, ergonomie, tests et robustesse.
- Chaque section ci-dessous est un ticket ; il doit etre ferme avec son test et son critere d'acceptation.

## Etat actuel

- [ ] Corriger les erreurs TypeScript avant toute mise en production.
- [ ] Corriger les erreurs ESLint.
- [ ] Executer les tests Laravel et ajouter les tests mobiles manquants.
- [ ] Verifier les parcours sur Android reel, iOS reel et appareil sans reseau.
- [ ] Verifier les routes Expo Router generees avec `expo export`.

Le dernier controle TypeScript echoue notamment dans `mapsScreen.tsx`, `orderdetailScreen.tsx`, `notificationdetailScreen.tsx`, `productdetailScreen.tsx`, `LitigeBottomSheet.tsx`, `Ordercard.tsx` et les ecrans wallet. Le lint echoue aussi sur plusieurs textes non echappes et signale des hooks/imports inutilises.

## Tickets TAX - ajout TTC backend et frontend

### TAX-P0-001 - Confirmer le contrat TTC backend

- [ ] Identifier les champs reels ajoutes au backend : taux de taxe, montant de taxe, sous-total HT et total TTC.
- [ ] Verifier migrations, Resources, validations, services, notifications, wallet et endpoints concernés.
- [ ] Confirmer les noms definitifs, par exemple `subtotal_ht`, `tax_rate`, `tax_amount`, `total_ttc`.
- [ ] Preciser si le TTC concerne le prix unitaire, la commande, les frais de livraison ou les trois.
- [ ] Documenter la formule et l'arrondi FCFA : `total_ttc = subtotal_ht + tax_amount`.
- Note audit : les fichiers backend consultes exposent encore surtout `total_price` et `delivery_fees`; les champs TTC doivent donc etre confirmes dans la version backend livree.
- Acceptation : un exemple de reponse API documente HT, taux, taxe, frais et TTC.

### TAX-P0-002 - Exposer le TTC dans l'API

- [ ] Ajouter les champs TTC aux `ProductResource` et `OrderResource` si necessaire.
- [ ] Propager ces champs dans home, detail produit, detail commande, notifications, wallet et evenements Reverb.
- [ ] Definir clairement si `total_price` signifie HT ou TTC pendant la migration.
- [ ] Recalculer tous les montants cote serveur ; le mobile ne doit jamais etre la source de verite.
- [ ] Ajouter les tests taux zero, montant normal, arrondi et frais de livraison taxes.
- Acceptation : le backend renvoie le meme TTC officiel dans chaque representation d'une commande.

### TAX-P0-003 - Ajouter le TTC aux types mobiles

- [ ] Ajouter les champs TTC aux interfaces produit, commande, notification, wallet et home.
- [ ] Mettre a jour providers, slices et composants sans casts `any` inutiles.
- [ ] Afficher les libelles exacts `HT`, `Taxe`, `Frais de livraison` et `TTC`.
- [ ] Gerer les anciennes reponses sans champs TTC avec un etat de migration explicite.
- Acceptation : `pnpm exec tsc --noEmit` passe et aucun ecran ne confond HT et TTC.

### TAX-P0-004 - Afficher le TTC dans tout le parcours acheteur

- [ ] Mettre a jour carte produit, carte, bottom sheet, confirmation de commande et detail commande.
- [ ] Afficher prix unitaire HT, taxe ou taux, sous-total, frais, taxe frais si applicable et total TTC.
- [ ] Afficher le meme TTC dans historique, notifications et wallet/sequestre.
- [ ] Verifier que le montant avant validation est identique au montant final renvoye par l'API.
- Acceptation : un parcours complet permet de verifier visuellement le calcul de la commande.

### TAX-P0-005 - Afficher le TTC par role

- [ ] Producteur : afficher HT, taxe, TTC acheteur et gain net selon la regle metier.
- [ ] Transporteur : afficher sa remuneration et preciser si une taxe lui est applicable.
- [ ] Aligner les montants wallet, transactions, notifications et temps reel.
- Acceptation : buyer, producer et transporter voient des montants coherents pour la meme commande.

## Tickets P0 - bloquants fonctionnels

### MOB-P0-003 - Compilation et contrats

- [ ] Corriger le `SafeAreaView` importe depuis `react-native` au lieu de `react-native-safe-area-context` dans les ecrans acheteur et wallet.
- [ ] Ajouter ou supprimer `distanceRemainingLabel` dans `mapsScreen.tsx` selon le contrat reel de `usemapsTracking`.
- [ ] Unifier les statuts de commande. Le backend utilise `paid_searching_driver` et `assigned_to_driver`, tandis que `homeType.ts` et `Ordercard.tsx` utilisent `searching` et `assigned`.
- [ ] Remplacer les champs inexistants `pending`, `buyer_latitude`, `buyer_longitude` et utiliser `delivery_latitude`/`delivery_longitude` partout.
- [ ] Aligner les types de commande : `quantity`, `producer`, `last_name`, `phone` et `transporter` doivent exister dans les interfaces utilisees par le detail.
- [ ] Ajouter l’action `reportDispute` dans `providers/orders/ordersProviderAction.ts`, avec upload multipart compatible React Native.
- [ ] Remplacer `PhotoPlus` par une icone disponible ou ajouter l’icone correcte.
- [ ] Supprimer la route inexistante `/other/producer/storeproductScreen` ou creer l’ecran correspondant.

### MOB-P0-004 - Navigation et routes

- [ ] Corriger le layout transporteur : `trajects` et `status` sont references mais les fichiers n’existent pas.
- [ ] Remplacer les appels `navigation.navigate('NotificationDetail')` par des routes Expo Router existantes.
- [ ] Remplacer `/orders/{id}/tracking`, route absente, par l’ecran carte ou creer un ecran de suivi dedie.
- [ ] Creer l’ecran `RecurringOrders` ou retirer le bouton de programmation de fidelite jusqu’a son implementation.
- [ ] Supprimer `notificationListScreen copy.tsx` pour eviter deux sources de code.
- [ ] Verifier les chemins avec majuscules, notamment `Settings.tsx`, sur Android et dans le build CI.

## Tickets P1 - fonctionnalites manquantes

### MOB-P1-002 - Authentification et compte

- [ ] Ajouter une garde d’authentification au demarrage : token present => verifier `/user`, token absent/invalide => login.
- [ ] Corriger le chemin de recuperation utilisateur : `authProviderAction.ts` appelle `/v1/user` alors que le backend expose aussi une route `/user` dans `routes/api.php`; valider l’URL finale avec `EXPO_PUBLIC_API_URL`.
- [ ] Implementer la deconnexion dans les trois espaces : supprimer le token AsyncStorage, vider les slices Redux, quitter Echo et rediriger vers login.
- [ ] Implementer Modifier mon profil.
- [ ] Implementer Verification d’identite avec upload, statut, erreurs et reprise.
- [ ] Implementer Changer le mot de passe.
- [ ] Implementer la page de preferences notifications.
- [ ] Afficher une erreur utilisateur dans le `catch` de `handleLogin`, pas seulement dans la console.

### PROD-P1-001 - Parcours producteur

- [ ] Ajouter la modification d’un produit.
- [ ] Ajouter la suppression d’un produit avec confirmation, appel API et mise a jour Redux.
- [ ] Afficher les vraies photos `stock_proof_photo` au lieu des placeholders.
- [ ] Rafraichir la liste apres publication et gerer le succes sans doublon.
- [ ] Ajouter une recherche fonctionnelle aux commandes producteur.
- [ ] Ajouter refresh, empty state et erreur exploitable dans les commandes producteur.

### BUY-P1-001 - Parcours acheteur

- [ ] Ajouter une page detail produit acheteur distincte si les droits producteur/acheteur different.
- [ ] Remplacer le frais de livraison saisi manuellement par un calcul ou une selection d’adresse valide.
- [ ] Verifier que le montant debite correspond toujours a `total_price + delivery_fees` cote serveur.
- [ ] Ajouter un choix de paiement explicite : wallet ou Mobile Money, avec confirmation et statut final.
- [ ] Ajouter les actions de commande annuler, litige et confirmation de livraison selon le statut.
- [ ] Verifier le suivi GPS avec permissions refusees, GPS desactive, reseau absent et commande terminee.

### DRIVER-P1-001 - Parcours transporteur

- [ ] Brancher `DriverStatusToggle` sur un thunk API reel. Actuellement le statut est seulement modifie localement.
- [ ] Utiliser `POST /driver/ping` pour envoyer position et statut selon la politique de consentement.
- [ ] Implementer les ecrans trajets et statut references dans le tab bar.
- [ ] Ajouter les transitions de course : accepter, collecte QR, transport, livraison QR.
- [ ] Ajouter confirmation avant acceptation et gerer le conflit si un autre chauffeur a deja pris la course.
- [ ] Ajouter un refresh et un message d’erreur dans la liste des courses.

### WALLET-P1-001 - Wallet, MoMo et fidelite

- [ ] Brancher les boutons `Retirer` et `Historiques` des wallets producteur/transporteur.
- [ ] Afficher le statut MoMo `pending`, `successful`, `failed` avec reprise apres fermeture de l’application.
- [ ] Eviter le polling concurrent et arreter tout intervalle au demontage.
- [ ] Afficher l’historique complet avec details d’une transaction.
- [ ] Implementer les commandes recurrentes : liste, creation, pause/reprise et annulation.
- [ ] Ajouter confirmation et erreurs metier pour retrait, recharge et solde insuffisant.

### NOTIF-P1-001 - Notifications et temps reel

- [ ] Remplacer les navigations React Navigation restantes par `router.push`.
- [ ] Verifier les types reels envoyes par Laravel au lieu de dependre des hypotheses dans les commentaires.
- [ ] Gerer les notifications recues quand le dropdown est ferme et eviter les doublons apres pagination.
- [ ] Gerer l’echec de marquage lu et de suppression avec retour utilisateur.
- [ ] Verifier que le canal Echo utilise correspond au role et a l’identifiant utilisateur.

## Tickets P0/P1 - securite confirmee ou fortement probable

### SEC-P0-004 - Secrets et donnees sensibles

- [ ] Ne jamais logger le formulaire d’inscription complet : `registerScreen.tsx` logge `form`, qui contient le mot de passe.
- [ ] Ne jamais logger `formData` dans `CreateUserAction` : il contient aussi le mot de passe.
- [ ] Supprimer les logs de payloads API en production, notamment reponses de login, inscription, wallet et paiement.
- [ ] La cle Google Maps presente dans `.env` doit etre restreinte par application/package, APIs autorisees et quotas. Ne jamais la considerer comme un secret serveur.
- [ ] Verifier que `.env` et `.local.env` ne sont pas suivis par Git et regenerer toute cle deja publiee dans un depot ou une archive.
- [ ] Remplacer AsyncStorage pour le JWT par un stockage securise adapte a la plateforme, par exemple SecureStore, avec expiration et rotation gerees.

### SEC-P0-005 - Session et autorisation

- [ ] Gerer globalement les reponses HTTP 401 : vider la session et rediriger vers login.
- [ ] Ne pas initialiser Echo deux fois dans `app/_layout.tsx`.
- [ ] Ne pas ouvrir les canaux prives avant validation du token et de l’utilisateur courant.
- [ ] Verifier cote backend l’autorisation de chaque commande, produit, notification, wallet et fichier, pas seulement l’existence de l’ID.
- [ ] Ne jamais faire confiance au role ou aux montants fournis par le mobile ; le serveur doit recalculer role, prix, stock, frais et droits.
- [ ] Verifier les limites de taille, MIME reel et contenu des photos et preuves envoyees en multipart.

### SEC-P0-006 - Route de test critique

- [ ] Supprimer ou proteger immediatement `POST /test-momo` dans `routes/api.php`. Cette route semble accessible sans middleware d’authentification et contacte Mobile Money avec un montant et un numero de test.
- [ ] Ne laisser aucune route de debug, dump de reponse, identifiant de transaction ou credential de sandbox active en production.
- [ ] Desactiver les logs de donnees personnelles et les erreurs trop detaillees cote production.

## Tickets P2 - qualite produit et robustesse

- [ ] Ajouter un etat de chargement, erreur, vide, retry et pull-to-refresh a chaque liste.
- [ ] Ajouter des limites de longueur et validation locale cohérente des champs.
- [ ] Utiliser un composant de formatage de devise unique avec XOF/FCFA et nombres decimaux coherents.
- [ ] Gerer les dates invalides et les fuseaux horaires.
- [ ] Ajouter accessibilite : labels, tailles de zone tactile, contraste, lecture des badges et erreurs.
- [ ] Verifier les petits ecrans : textes longs, tab bar flottante, clavier, encoche et safe areas.
- [ ] Remplacer les emojis et placeholders par des icones/assets coherents lorsque necessaire.
- [ ] Reduire les imports inutilises et corriger les dependances des `useEffect` signalees par ESLint.
- [ ] Ajouter un Error Boundary et un ecran de panne recuperable.
- [ ] Ajouter gestion reseau hors ligne avec message clair et reprise, surtout pour GPS, wallet et QR.

## Tickets P1 - tests a ajouter

### TEST-P1-001 - Tests mobiles

- [ ] Login valide, invalide, role inconnu et erreur reseau.
- [ ] Inscription avec validation, confirmation mot de passe et erreur backend 422.
- [ ] Garde de session, expiration JWT et deconnexion complete.
- [ ] Creation produit avec photo, validation et erreur upload.
- [ ] Creation commande avec stock insuffisant, solde insuffisant et frais invalides.
- [ ] Acceptation de course concurrente par deux transporteurs.
- [ ] Scan QR collecte/livraison valide, invalide, permission refusee et double scan.
- [ ] Recharge/retrait MoMo pending, succes, echec, timeout et reprise.
- [ ] Notifications pagination, lecture, suppression, temps reel et navigation.
- [ ] Statut chauffeur persiste apres refresh et erreur API.

### TEST-P1-002 - Tests backend et integration

- [ ] Executer `docker compose exec laravel.test php artisan test` apres chaque correction API.
- [ ] Tester les permissions par role et la propriete des ressources.
- [ ] Tester les routes sans token, token expire, mauvais role et ID d’une autre personne.
- [ ] Tester les montants et transitions de commande dans des transactions concurrentes.
- [ ] Tester les limites et validations des uploads.
- [ ] Ajouter un controle CI : TypeScript, ESLint, tests Laravel et build Expo.

## Ticket de pilotage

### PM-P0-001 - Ordre de livraison recommande

1. Corriger TypeScript, routes et contrats de statuts.
2. Fermer les failles de logs, stockage JWT et route `/test-momo`.
3. Implementer garde de session et deconnexion.
4. Terminer le flux commande + QR + litige.
5. Terminer statut transporteur, wallet et paiement.
6. Terminer compte, fidelite et notifications.
7. Ajouter tests, accessibilite, offline et validation des builds Android/iOS.

## Ticket de pilotage

### PM-P0-002 - Definition de fini

- [ ] `pnpm exec tsc --noEmit` passe sans erreur.
- [ ] `pnpm lint` passe sans erreur.
- [ ] Les tests Laravel passent.
- [ ] Aucun secret, mot de passe ou payload sensible n’apparait dans les logs de production.
- [ ] Aucun bouton visible n’est sans action ou sans etat explicatif.
- [ ] Chaque route referencee existe et fonctionne depuis Android et iOS.
- [ ] Les permissions et erreurs reseau ont un comportement utilisateur explicite.
- [ ] Les parcours buyer, producer et transporter sont testes de bout en bout.
