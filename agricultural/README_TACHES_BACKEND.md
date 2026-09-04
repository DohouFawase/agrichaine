# Agricultural API - suivi des tickets backend

Date de l'audit : 2026-09-04
Projet : API Laravel d'Onabaya
Documentation generale : [README.md](README.md)

## Regles

- `P0` : faille de securite, perte financiere, incoherence de donnees ou API inutilisable.
- `P1` : fonctionnalite importante incomplete ou risque eleve.
- `P2` : qualite, performance, documentation et tests.
- Une tache est fermee uniquement avec un test et une preuve de validation.
- Les montants officiels, taxes et TTC sont toujours calcules cote serveur.

## Convention Git par feature

Le depot etant partage par le backend, le mobile et la landing page, chaque feature doit utiliser une branche dediee liee a un ticket.

### Nommage des branches

Format : `type/domaine-ticket-description`

Types autorises :

- `feat` : nouvelle fonctionnalite ;
- `fix` : correction de bug ;
- `security` : correction de securite ;
- `test` : ajout ou correction de tests ;
- `docs` : documentation uniquement ;
- `chore` : maintenance, CI ou dependances.

Domaines autorises : `backend`, `mobile`, `contract`, `tax`, `auth`, `orders`, `wallet`, `momo`, `tracking`, `notifications`, `loyalty`, `trips`, `products`, `release`.

Exemples :

```text
security/backend-SEC-BE-P0-001-remove-test-momo
security/backend-SEC-BE-P0-002-protect-wallet-deposit
fix/backend-SEC-BE-P0-003-order-ownership
feat/contract-NEW-BE-P0-001-sync-api-mobile
feat/tax-TAX-BE-P0-002-calculate-ttc
feat/orders-ORDER-BE-P1-002-idempotency
test/backend-TEST-BE-P1-001-security-coverage
```

### Regles de travail

- Partir de `main` a jour quand le ticket est independant.
- Garder une branche pour un seul ticket ou un petit groupe de tickets dependants.
- Utiliser uniquement minuscules, chiffres et tirets dans le nom de branche.
- Ne pas utiliser d'espace, d'accent, de mot de passe ou de nom de personne.
- Ne pas melanger une correction backend et une refonte sans rapport dans la meme branche.
- Pour une feature partagee backend/mobile, utiliser deux branches liees au meme ticket :
	`feat/backend-TAX-BE-P0-002-calculate-ttc` et `feat/mobile-TAX-MOB-P0-003-display-ttc`.
- Ne pas rebaser ou changer de branche avec des modifications non sauvegardees sans verifier `git status`.

### Nommage des commits

Format : `type(scope): action courte [TICKET]`

Exemples :

```text
security(auth): remove sensitive registration logs [SEC-BE-P0-005]
feat(tax): add server-side TTC amounts [TAX-BE-P0-002]
fix(orders): lock concurrent driver assignment [ORDER-BE-P1-002]
test(api): cover ownership policies [TEST-BE-P1-001]
```

### Pull request

Le titre reprend le ticket : `[SEC-BE-P0-003] Protect order resources`.

La description doit contenir : ticket, fichiers touches, migration eventuelle, tests executes, impact mobile, impact TTC et risques residuels. Une PR ne doit pas etre fusionnee si un ticket P0 reste partiellement traite ou si les tests de sortie echouent.


## Feuille de route d'execution

Cette sequence doit etre suivie dans l'ordre. Une etape ne peut pas etre declaree terminee si son controle de sortie echoue.

### Etape 1 - Figer l'etat initial

- [ ] Creer une branche de travail dediee.
- [ ] Exporter la liste des routes avec `php artisan route:list --path=api/v1`.
- [ ] Executer `php artisan migrate:status` et noter la version de schema.
- [ ] Executer `docker compose exec laravel.test php artisan test` avant toute correction.
- [ ] Noter les erreurs TypeScript mobile qui dependent du contrat backend.
- Livrable : rapport initial date avec routes, migrations, tests et erreurs connus.
- Sortie : les regressions nouvelles sont distinguables des problemes preexistants.

### Etape 2 - Fermer les acces dangereux

- [ ] Supprimer ou proteger `/api/test-momo`.
- [ ] Supprimer le depot wallet direct `/api/v1/deposit`, ou le remplacer par un flux fournisseur verifie.
- [ ] Rechercher puis supprimer logs de tokens, mots de passe, credentials, numeros complets et payloads MoMo.
- [ ] Verifier `APP_DEBUG=false`, HTTPS, CORS et rate limiting de production.
- Livrable : diff de securite et test HTTP des routes sensibles.
- Sortie : aucun appel public ne peut crediter un wallet ou contacter MoMo en production.

### Etape 3 - Uniformiser le domaine commande

- [ ] Choisir `transporter_id` comme nom canonique et supprimer les references `driver_id` obsoletes.
- [ ] Choisir les statuts officiels et les utiliser dans migrations, modeles, services, resources, events et tests.
- [ ] Formaliser la machine a etats et les acteurs autorises par transition.
- [ ] Ajouter policies/gates pour commande, tracking, produit, wallet, transaction et notification.
- Livrable : tableau des transitions et policies testees par role.
- Sortie : une commande ne peut etre lue ou modifiee par un utilisateur non autorise.

### Etape 4 - Verrouiller les operations financieres

- [ ] Recalculer produit, stock, frais et montant final depuis la base.
- [ ] Ajouter verrous SQL et contraintes d'idempotence sur assignation, QR, MoMo et liberation.
- [ ] Traiter timeout, annulation, remboursement et stock epuise apres paiement.
- [ ] Rendre les retries reseau sans effet financier double.
- Livrable : tests de concurrence et de retry.
- Sortie : une operation financiere ne peut etre appliquee qu'une seule fois.

### Etape 5 - Implementer et documenter TTC

- [ ] Valider la regle fiscale : taux, postes taxes, devise XOF et arrondi.
- [ ] Ajouter migration reversible et champs historiques HT/taxe/TTC.
- [ ] Calculer et stocker les montants officiels dans le service de commande.
- [ ] Propager les champs dans Resources, home, wallet, notifications, events et MoMo.
- [ ] Mettre a jour le mobile seulement apres validation de l'exemple JSON.
- Livrable : contrat JSON, exemple chiffre et tests taux zero/normal/arrondi.
- Sortie : le meme TTC apparait dans toutes les representations d'une commande.

### Etape 6 - Finaliser metier et fichiers

- [ ] Completer CRUD produit avec policy proprietaire et gestion atomique du stock.
- [ ] Completer profil, identite, mot de passe et documents sur stockage prive.
- [ ] Completer litiges, resolution admin et remboursements.
- [ ] Completer trajets, fidelite, commandes recurrentes et notifications.
- [ ] Valider MIME, taille, contenu et autorisation de lecture des uploads.
- Livrable : endpoints documentes et tests des roles.
- Sortie : chaque fonctionnalite exposee au mobile possede une route fonctionnelle et autorisee.

### Etape 7 - Fiabiliser exploitation

- [ ] Configurer queue, workers, scheduler, cache distribue et Reverb.
- [ ] Ajouter jobs de reprise MoMo et notifications en echec.
- [ ] Ajouter retention tracking/notifications et sauvegardes chiffrees.
- [ ] Ajouter logs structures sans donnees sensibles, monitoring et alertes.
- Livrable : runbook paiement, incident, rollback et restauration.
- Sortie : le service est observable et recuperable apres panne.

### Etape 8 - Valider la release

- [ ] Executer `migrate:fresh --seed` sur une base de test propre.
- [ ] Executer tests unitaires, Feature, policies, concurrence et integration MoMo simulee.
- [ ] Verifier routes, Resources et contrat TTC avec le mobile.
- [ ] Tester 401, 403, 404, 409, 422, 429 et 500.
- [ ] Deployer en staging, tester les trois roles, puis valider la checklist production.
- Livrable : rapport de release signe et liste des risques residuels.
- Sortie : aucun ticket P0 ouvert et tous les controles CI passent.

## Ticket transversal nouveau

### NEW-BE-P0-001 - Synchroniser le contrat backend et mobile

- [ ] Creer un tableau unique des routes, methodes, roles, payloads et reponses.
- [ ] Comparer les types mobile avec les `JsonResource` backend.
- [ ] Synchroniser statuts commande, noms de champs, UUID, devise et erreurs HTTP.
- [ ] Ajouter une section TTC commune : HT, taux, taxe, frais, TTC et gain par role.
- [ ] Ajouter un exemple JSON versionne et un test de contrat.
- [ ] Executer ce controle avant chaque modification de `Resource`, migration ou endpoint.
- Acceptation : TypeScript mobile et tests API utilisent le meme contrat versionne, sans cast ou champ invente.

## Sprint 0 - securite urgente

### SEC-BE-P0-001 - Fermer la route de test MoMo

- [ ] Supprimer `POST /test-momo` de `routes/api.php`, ou la proteger par une autorisation admin et un environnement non productif.
- [ ] Supprimer le numero et le montant de test codifies en dur.
- [ ] Ajouter un test qui refuse l'appel sans authentification.
- Acceptation : aucune route de test ou sandbox ne contacte MoMo en production.

### SEC-BE-P0-002 - Supprimer les depots wallet non verifies

- [ ] Retirer ou remplacer `POST /deposit` qui credite directement un wallet avec une reference envoyee par le client.
- [ ] Utiliser uniquement le flux MoMo verifie et idempotent.
- [ ] Rendre la reference serveur ou imposer une contrainte d'idempotence.
- [ ] Journaliser l'audit de l'operation sans exposer de donnees sensibles.
- Acceptation : un client ne peut pas augmenter son solde en forgeant une requete HTTP.

### SEC-BE-P0-003 - Verifier la propriete des ressources

- [ ] Proteger `GET /orders/{id}` afin qu'un utilisateur ne lise que ses commandes autorisees.
- [ ] Proteger `GET/POST /orders/{id}/tracking` et le batch selon buyer/transporter concerne.
- [ ] Verifier l'autorisation avant toute transition de commande.
- [ ] Verifier produit, wallet, notification, document d'identite et transaction par utilisateur/role.
- [ ] Utiliser policies ou gates Laravel plutot que des controles disperses.
- Acceptation : un utilisateur avec un autre UUID obtient `403` ou `404` sans fuite de donnees.

### SEC-BE-P0-004 - Unifier l'identite chauffeur

- [ ] Remplacer les references obsoletes `driver_id` par `transporter_id`, ou choisir un nom canonique.
- [ ] Corriger les statuts obsoletes `escrowed`, `dispute` et les aligner sur les valeurs de la migration et des services.
- [ ] Supprimer ou archiver les implementations dupliquees de `OrderCollectionServiceProvider` si elles ne sont plus utilisees.
- Acceptation : un seul service et un seul vocabulaire controlent collecte, livraison et litige.

### SEC-BE-P0-005 - Fermer les logs sensibles

- [ ] Ne pas logger tokens, credentials, corps complets MoMo, telephone complet ou payloads utilisateur.
- [ ] Masquer les numeros de telephone et references dans les logs.
- [ ] Ne jamais renvoyer `$e->getMessage()` brut au client en production.
- [ ] Configurer rotation, retention et acces aux logs.
- Acceptation : les logs de production ne contiennent ni secret, ni PII inutile, ni detail interne exploitable.

## Sprint 1 - contrat prix, taxes et TTC

### TAX-BE-P0-001 - Definir le modele fiscal

- [ ] Confirmer si la taxe concerne produit, livraison, commande ou chacun de ces postes.
- [ ] Definir le taux, la devise XOF, la methode d'arrondi et la date d'application.
- [ ] Definir les champs canoniques : `subtotal_ht`, `tax_rate`, `tax_amount`, `delivery_fees_ht`, `delivery_tax_amount`, `total_ttc`.
- [ ] Definir le traitement d'une modification future du taux sur les commandes historiques.
- Acceptation : la formule et un exemple chiffre sont documentes et valides par le metier.

### TAX-BE-P0-002 - Stocker et calculer le TTC cote serveur

- [ ] Ajouter une migration reversible pour les montants et taux necessaires.
- [ ] Recalculer les montants depuis le produit en base et les frais valides.
- [ ] Ne jamais accepter `total_price`, `tax_amount` ou `total_ttc` du mobile comme source de verite.
- [ ] Utiliser des types monetaires coherents et eviter les erreurs d'arrondi.
- [ ] Ajouter tests taux zero, taux normal, arrondi et montant limite.
- Acceptation : le montant debite est toujours le TTC calcule par le serveur.

### TAX-BE-P0-003 - Propager le TTC dans toutes les representations

- [ ] Mettre a jour `ProductResource`, `OrderResource`, home, wallet et notifications.
- [ ] Mettre a jour les evenements Reverb et les reponses MoMo/transactions concernes.
- [ ] Documenter la signification temporaire de `total_price` pendant la migration.
- [ ] Ajouter un exemple OpenAPI/README de chaque reponse.
- Acceptation : une commande renvoie les memes HT, taxes, frais et TTC partout.

## Sprint 1 - commandes et logistique

### ORDER-BE-P1-001 - Formaliser la machine a etats

- [ ] Definir les transitions autorisees : paiement, recherche, assignation, collecte, livraison, litige, annulation.
- [ ] Refuser les transitions arbitraires de `PATCH /orders/{id}/status`.
- [ ] Verifier l'acteur autorise pour chaque transition.
- [ ] Ajouter historique de statut, acteur, date et motif.
- Acceptation : une transition impossible est refusee sans modifier la commande.

### ORDER-BE-P1-002 - Rendre assignation et operations idempotentes

- [ ] Verrouiller la commande lors de l'acceptation concurrente.
- [ ] Ajouter contrainte ou transaction empechant deux transporteurs d'etre assignes.
- [ ] Rendre QR collecte, livraison et MoMo idempotents.
- [ ] Gerer les retries reseau sans double paiement, double liberation ou double notification.
- Acceptation : deux appels concurrents produisent une seule assignation et une seule operation financiere.

### ORDER-BE-P1-003 - Finaliser les litiges et remboursements

- [ ] Ajouter route/controller/service mobile correspondant a `POST /orders/{id}/dispute`.
- [ ] Definir les statuts et transitions `disputed`/resolution.
- [ ] Implementer decision admin, remboursement total/partiel et journal financier.
- [ ] Verifier les uploads de preuve : MIME reel, taille, stockage prive et autorisation de lecture.
- Acceptation : un litige conserve les fonds, est visible par les acteurs autorises et peut etre resolu avec trace.

### ORDER-BE-P1-004 - Completer les flux paiement MoMo

- [ ] Ajouter reprise webhook ou job serveur, sans dependre uniquement du polling mobile.
- [ ] Gerer timeout, annulation, remboursement et stock epuise apres paiement.
- [ ] Verifier la devise sandbox/prod et les credentials par environnement.
- [ ] Ajouter idempotence sur `external_reference` et verrou transactionnel.
- Acceptation : aucune commande ou wallet ne reste incoherent apres timeout, retry ou reponse MoMo dupliquee.

### TRACK-BE-P1-001 - Securiser et fiabiliser le tracking

- [ ] Verifier que seul le transporteur affecte peut ecrire les positions.
- [ ] Verifier que buyer, producteur et transporteur autorises peuvent lire uniquement la commande concernee.
- [ ] Valider latitude/longitude avec bornes geographiques et date non future excessive.
- [ ] Limiter frequence, volume batch et retention des positions.
- [ ] Diffuser une position arrondie ou minimisee si la precision exacte n'est pas necessaire.
- Acceptation : aucune position n'est ecrite par un tiers et les abus de volume sont limites.

## Sprint 1 - produits, comptes et fichiers

### PROD-BE-P1-001 - Completer CRUD produit

- [ ] Ajouter update/delete avec policy producteur proprietaire.
- [ ] Gerer stock reserve, stock disponible, expiration et sold out atomiquement.
- [ ] Valider unicite, unite, prix, quantite et localisation.
- [ ] Supprimer ou remplacer correctement l'ancienne photo apres modification.
- Acceptation : un producteur ne peut modifier ni supprimer le produit d'un autre.

### USER-BE-P1-001 - Finaliser compte et identite

- [ ] Ajouter endpoints profil, changement mot de passe et verification identite.
- [ ] Stocker les documents d'identite dans un disque prive, jamais dans une URL publique sans controle.
- [ ] Ajouter workflow de verification admin et audit des decisions.
- [ ] Invalider les sessions apres changement de mot de passe ou compromission.
- Acceptation : les donnees d'identite ne sont visibles que par l'utilisateur et les admins autorises.

### API-BE-P1-001 - Normaliser erreurs et validation

- [ ] Utiliser Form Requests partout au lieu de validations inline dispersees.
- [ ] Retourner un format d'erreur JSON stable pour mobile.
- [ ] Ne pas retourner de stack trace ou message d'exception interne en production.
- [ ] Ajouter correlation ID pour le support sans logguer de secrets.
- Acceptation : le mobile peut afficher une erreur stable pour 401, 403, 404, 409, 422 et 500.

## Sprint 1 - fidelite, trajets et notifications

### LOYAL-BE-P1-001 - Terminer les commandes recurrentes

- [ ] Implementer pause/reprise si le modele et le controller ne le font pas encore.
- [ ] Verifier stock, prix, TTC, solde et adresse a chaque execution.
- [ ] Rendre `ProcessRecurringOrders` idempotent et observable.
- [ ] Gerer echec d'execution, prochaine tentative et notification.
- Acceptation : une commande recurrente ne cree jamais deux commandes pour la meme echeance.

### TRIP-BE-P1-001 - Finaliser trajets transporteur

- [ ] Documenter et tester creation, liste, modification, annulation et disponibilite.
- [ ] Verifier proprietaire, statut, date, poids et compatibilite avec une commande.
- [ ] Exposer les endpoints utilises par les onglets mobiles ou retirer les onglets non implementes.
- Acceptation : le parcours trajet mobile correspond aux routes reelles.

### NOTIF-BE-P1-001 - Fiabiliser notifications

- [ ] Verifier payloads, types, producteur, commande et montants TTC emis.
- [ ] Gerer lecture, suppression et pagination avec autorisation par notifiable.
- [ ] Configurer queue/retry des notifications et traitement des echecs.
- [ ] Ajouter retention et nettoyage des anciennes notifications.
- Acceptation : un utilisateur ne recoit ni ne lit la notification d'un autre compte.

## Sprint 2 - qualite, observabilite et exploitation

### DB-P1-001 - Stabiliser migrations et schema

- [ ] Verifier ordre des migrations, colonnes utilisees et rollback sur une base propre.
- [ ] Ajouter index sur commandes par role/statut, transactions, notifications et tracking.
- [ ] Ajouter contraintes uniques et cles etrangeres necessaires.
- [ ] Verifier le type UUID partout et supprimer les references obsoletes.
- Acceptation : `migrate:fresh --seed` et rollback sont reproductibles.

### OPS-P1-001 - Configurer production

- [ ] Verifier `APP_ENV`, `APP_DEBUG=false`, HTTPS, CORS, rate limiting et cookies/session.
- [ ] Stocker secrets uniquement dans le gestionnaire d'environnement/deploiement.
- [ ] Configurer queue, scheduler, cache distribue et worker pour notifications/MoMo.
- [ ] Mettre en place sauvegardes chiffrees, monitoring et alertes.
- [ ] Rediger runbook incident paiement, fuite de token et indisponibilite MoMo.
- Acceptation : un deploiement production ne contient aucune cle de developpement ou route de test.

### PERF-P2-001 - Optimiser requetes et payloads

- [ ] Supprimer N+1 sur home, commandes, wallet et notifications.
- [ ] Paginer toutes les listes volumineuses.
- [ ] Limiter les payloads tracking et notifications.
- [ ] Ajouter cache uniquement avec invalidation claire.
- Acceptation : les endpoints principaux respectent un budget de latence et de taille documente.

### TEST-BE-P1-001 - Completer les tests

- [ ] Ajouter tests de policies/ownership sur chaque endpoint.
- [ ] Ajouter tests TTC, arrondi, devise et concurrence financiere.
- [ ] Ajouter tests MoMo idempotence, timeout, webhook et remboursement.
- [ ] Ajouter tests upload, rate limiting, 401/403/404/409/422.
- [ ] Ajouter tests jobs, scheduler, notifications et canaux prives.
- Acceptation : la suite couvre les risques P0/P1 et passe en CI.

## Ordre de livraison

1. Fermer les routes de test, depots artificiels et controles d'acces.
2. Unifier statuts, identifiants et services de commande.
3. Valider puis propager le contrat TTC.
4. Rendre paiements, QR, assignation et tracking idempotents.
5. Completer comptes, produits, trajets, notifications et fidelite.
6. Ajouter tests, observabilite, performance et procedure de release.
