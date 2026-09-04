# Landing Onabaya - suivi des tickets

Date de l'audit : 2026-09-04
Projet : landing page Next.js de pre-lancement
Brief produit : [PROJECT_BRIEF_ONABAYA.md](PROJECT_BRIEF_ONABAYA.md)

## Priorites

- `P0` : securite, formulaire inutilisable ou probleme bloquant la publication.
- `P1` : fonctionnalite importante absente ou conversion degradee.
- `P2` : design, performance, SEO, accessibilite et maintenance.

## Feuille de route

### Etape 1 - Stabiliser le projet

- [ ] Executer `pnpm lint` et corriger les erreurs.
- [ ] Executer `pnpm build` et corriger les erreurs de build.
- [ ] Verifier les images, fonts, liens et sections sur mobile et desktop.
- Livrable : build Next.js reproductible.

### Etape 2 - Brancher la liste d'attente

- [ ] Creer une route backend dediee, ou choisir un fournisseur newsletter conforme.
- [ ] Definir les champs : nom, email, role et ville.
- [ ] Ajouter validation serveur, anti-spam, rate limiting et consentement.
- [ ] Ajouter etats loading, succes, erreur, doublon et mode hors ligne.
- [ ] Ne jamais afficher un succes avant confirmation serveur.
- Livrable : formulaire fonctionnel avec contrat API documente.

### Etape 3 - Finaliser le contenu et les langues

- [ ] Implementer le changement FR/EN reel, pas seulement le texte du brief.
- [ ] Completer header, navigation, footer, liens legaux et contact.
- [ ] Verifier que les promesses de paiement, livraison et securite sont exactes.
- [ ] Remplacer les chiffres ou temoignages non verifies.
- Livrable : contenu valide en francais et anglais.

### Etape 4 - SEO et partage

- [ ] Remplacer les metadonnees starter `Create Next App`.
- [ ] Ajouter title, description, canonical, Open Graph, Twitter Card et favicon Onabaya.
- [ ] Ajouter sitemap, robots.txt et donnees structurees Organization/Product si pertinentes.
- [ ] Ajouter apercu social et image OG réelle.
- Livrable : audit SEO sans metadonnees generiques.

### Etape 5 - Accessibilite et responsive

- [ ] Utiliser une structure HTML semantique avec un seul H1.
- [ ] Rendre FAQ utilisable au clavier avec `button`, `aria-expanded` et `aria-controls`.
- [ ] Ajouter labels, focus visibles, messages d'erreur lies aux champs et contraste conforme.
- [ ] Tester clavier, zoom, lecteurs d'ecran, 320 px et grands ecrans.
- Livrable : parcours accessible du hero au formulaire.

### Etape 6 - Confiance et securite

- [ ] Ajouter politique de confidentialite et consentement explicite de la waitlist.
- [ ] Ne pas exposer de secret dans le bundle client ou les variables `NEXT_PUBLIC_*`.
- [ ] Proteger formulaire contre spam, bots, injection et enumeration d'emails.
- [ ] Ne pas stocker plus de donnees que necessaire.
- [ ] Definir suppression/export des donnees et duree de retention.
- Livrable : checklist securite et donnees personnelles validee.

### Etape 7 - Performance et analytics

- [ ] Optimiser images avec `next/image` et formats modernes.
- [ ] Charger les fonts et scripts tiers avec budget de performance.
- [ ] Ajouter analytics avec consentement et evenements anonymises.
- [ ] Mesurer CTA hero, formulaire, role choisi et abandon.
- [ ] Verifier Core Web Vitals et poids JavaScript.
- Livrable : rapport Lighthouse mobile/desktop.

### Etape 8 - Mise en production

- [ ] Configurer variables d'environnement staging et production.
- [ ] Verifier domaine, HTTPS, headers securite, CSP et cache.
- [ ] Tester formulaire, emails, erreurs API et monitoring.
- [ ] Ajouter CI : lint, typecheck, build, tests et liens.
- [ ] Valider rollback et suppression des donnees de test.
- Livrable : checklist de release approuvee.

## Tickets fonctionnels

### LAND-P0-001 - Corriger lint, types et build

- [ ] Corriger `pnpm lint`.
- [ ] Ajouter un script `typecheck` si necessaire.
- [ ] Corriger les erreurs TypeScript et les imports inutilises.
- Acceptation : lint, typecheck et build passent en CI.

### LAND-P0-002 - Implementer la waitlist de bout en bout

- [ ] Ajouter endpoint backend public limite et documente.
- [ ] Valider email, role, ville, consentement et doublons.
- [ ] Ajouter protection anti-spam et rate limiting.
- [ ] Connecter `SignupFormSection` sans exposer de secret.
- Acceptation : une inscription valide est persistee une fois et les erreurs sont explicites.

### LAND-P1-001 - Implementer FR/EN

- [ ] Ajouter dictionnaires et detection/changement de langue.
- [ ] Traduire navigation, hero, sections, FAQ, formulaire, erreurs et footer.
- [ ] Mettre a jour `lang`, metadata et URLs partageables.
- Acceptation : le changement de langue traduit tout le parcours et reste actif au rechargement.

### LAND-P1-002 - Completer la navigation

- [ ] Ajouter ancres `Fonctionnement`, `Pour qui`, `Securite` et `FAQ`.
- [ ] Ajouter CTA hero et header vers le formulaire et les sections.
- [ ] Ajouter footer, contact, liens legaux et reseaux seulement s'ils existent.
- Acceptation : aucun lien ne pointe vers une section inexistante ou un placeholder.

### LAND-P1-003 - Finaliser la preuve produit

- [ ] Utiliser des images réelles ou assets produit identifiables.
- [ ] Montrer clairement champ, produit, telephone, commande et livraison.
- [ ] Ajouter alt text utile et attribution si un asset externe est utilise.
- Acceptation : la proposition de valeur est compréhensible sans decor abstrait.

## Tickets securite

### SEC-LAND-P0-001 - Proteger la collecte de donnees

- [ ] Obtenir consentement explicite avant inscription.
- [ ] Ajouter politique de confidentialite accessible.
- [ ] Minimiser les donnees et definir retention/suppression.
- [ ] Ne pas logger email, nom ou payload complet cote client/serveur.
- Acceptation : chaque donnée collectee a une finalite, une base legale et une politique de retention.

### SEC-LAND-P0-002 - Anti-spam et API

- [ ] Rate limiter par IP et email cote serveur.
- [ ] Ajouter honeypot ou challenge progressif et cooldown.
- [ ] Refuser les origines non autorisees et valider Content-Type.
- [ ] Normaliser email et rendre l'insertion idempotente.
- Acceptation : spam massif, injection et doubles soumissions ne degradent pas le service.

### SEC-LAND-P1-001 - Headers et dependances

- [ ] Configurer CSP, HSTS en production, frame-ancestors, Referrer-Policy et Permissions-Policy.
- [ ] Verifier dependances avec audit et mises a jour controlees.
- [ ] Ne pas mettre de cle privee dans le code client.
- Acceptation : headers securite presents et aucune vulnerabilite critique connue.

## Tickets qualite

### QA-LAND-P1-001 - SEO et metadata

- [ ] Remplacer `Create Next App` dans `app/layout.tsx`.
- [ ] Definir `lang` selon la langue active.
- [ ] Ajouter robots, sitemap, canonical et cartes sociales.
- Acceptation : partage social et indexation affichent Onabaya correctement.

### QA-LAND-P1-002 - Accessibilite

- [ ] Corriger FAQ et interactions clavier.
- [ ] Ajouter focus, labels, erreurs et navigation au clavier.
- [ ] Verifier contraste, taille texte et responsive.
- Acceptation : aucune action critique ne depend uniquement de la souris ou de la couleur.

### QA-LAND-P2-001 - Performance

- [ ] Optimiser images, fonts, animations et bundles.
- [ ] Eviter scripts analytics avant consentement.
- [ ] Tester Lighthouse et Core Web Vitals.
- Acceptation : budgets performance documentes et respectes.

### TEST-LAND-P1-001 - Tests landing

- [ ] Tester rendu hero, navigation, FAQ et formulaire.
- [ ] Tester validation, loading, succes, erreur, doublon et timeout.
- [ ] Tester FR/EN, clavier et petits ecrans.
- [ ] Tester headers, metadata et liens sortants.
- Acceptation : tests automatises et verification manuelle avant release.

## Convention Git

Format : `type/domaine-ticket-description`

```text
feat/landing-LAND-P1-001-i18n
feat/landing-LAND-P0-002-waitlist-api
security/landing-SEC-LAND-P0-001-consent
fix/landing-LAND-P0-001-build
seo/landing-QA-LAND-P1-001-metadata
```

Commits : `type(scope): action courte [TICKET]`

```text
feat(waitlist): connect signup endpoint [LAND-P0-002]
fix(a11y): make FAQ keyboard accessible [QA-LAND-P1-002]
security(form): add rate limit contract [SEC-LAND-P0-002]
```

## Definition de fini

- [ ] Lint, typecheck et build passent.
- [ ] La waitlist est connectee, validee et protegee contre le spam.
- [ ] FR/EN couvre tout le contenu visible.
- [ ] SEO, accessibilite, performance et headers sont verifies.
- [ ] Aucun secret ni donnee personnelle inutile n'est expose.
- [ ] Les trois roles et le parcours Onabaya sont compris sans promesse non verifiee.
