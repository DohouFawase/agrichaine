# Onabaya Landing Page

Landing page Next.js de pre-lancement pour Onabaya, marketplace agricole qui relie producteurs, acheteurs et transporteurs au Benin.

## Documentation

- [PROJECT_BRIEF_ONABAYA.md](PROJECT_BRIEF_ONABAYA.md) : brief produit, contenu et direction artistique.
- [README_TACHES_LANDING.md](README_TACHES_LANDING.md) : tickets de travail, securite, Git et release.
- Application mobile : [../onabaya/README.md](../onabaya/README.md).
- API Laravel : [../agricultural/README.md](../agricultural/README.md).

## Etat actuel

La page assemble deja les sections hero, probleme, solution, fonctionnement, fonctionnalites, appel a l'inscription et FAQ dans `app/page.tsx`.

Le projet reste a finaliser avant publication :

- le formulaire de liste d'attente est encore simule localement et n'est pas branche a une API ;
- le brief demande FR/EN, mais le changement de langue n'est pas encore implemente ;
- les metadata sont encore celles du starter Next.js et le document HTML est en anglais ;
- lint, build, SEO, accessibilite, anti-spam et politique de confidentialite doivent etre verifies.

Voir [README_TACHES_LANDING.md](README_TACHES_LANDING.md) pour le plan complet.

## Proposition de valeur

> Onabaya relie le champ au panier, avec un paiement securise et une livraison tracable.

La landing s'adresse a trois roles :

- `producer` : publier et vendre ses recoltes ;
- `buyer` : decouvrir, commander et suivre une livraison ;
- `transporter` : accepter des courses et valoriser ses trajets.

## Structure de la page

1. Header et navigation courte.
2. Hero et appel a l'action.
3. Probleme rencontre par les acteurs agricoles.
4. Solution et parcours `Publier -> Commander -> Transporter -> Confirmer`.
5. Fonctionnement par role.
6. Garanties : sequestre, suivi, QR et notifications.
7. Pourquoi rejoindre la liste d'attente.
8. Formulaire nom, email, role et ville.
9. FAQ.
10. Footer a completer avec liens legaux, contact et langue.

## Architecture

```text
app/
  page.tsx                 Composition de la landing
  layout.tsx               Layout, fonts et metadata
  globals.css              Tokens Tailwind et styles globaux
components/
  ux/                      Sections metier de la page
  ui/                      Composants d'interface reutilisables
public/                    Images et assets publics
```

Les sections actuelles sont dans `components/ux/` : hero, probleme, solution, fonctionnement, fonctionnalites, formulaire, FAQ et appel a l'inscription.

## Installation

Prerequis : Node.js et pnpm.

```bash
cd applandingpage
pnpm install
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Commandes :

```bash
pnpm dev       # developpement
pnpm lint      # ESLint
pnpm build     # build production
pnpm start     # servir le build
```

## Liste d'attente

Le brief prévoit une inscription avec :

- nom ;
- email ;
- rôle ;
- ville ;
- consentement de confidentialité.

L'API Laravel actuelle ne doit pas être supposée fournir une route publique de waitlist tant qu'elle n'est pas documentée et testée. Deux options sont possibles :

1. créer un endpoint Laravel public limité et idempotent ;
2. utiliser un fournisseur newsletter conforme et documenté.

Dans les deux cas, le formulaire doit gérer validation, chargement, succès, erreur, doublon, timeout et anti-spam. Il ne doit jamais afficher un succès avant confirmation du serveur.

## Langues

Le brief prévoit français et anglais. La solution doit traduire tout le contenu visible : navigation, hero, sections, rôles, FAQ, formulaire, erreurs et footer.

Le changement de langue doit aussi mettre à jour l'attribut HTML `lang`, les metadata et les URLs partageables si un routage localisé est retenu.

## SEO et partage

A compléter dans `app/layout.tsx` et les fichiers publics :

- titre et description Onabaya ;
- canonical ;
- Open Graph et Twitter Card ;
- favicon et image sociale ;
- `robots.txt` et sitemap ;
- donnees structurees si pertinentes.

Aucune metadata `Create Next App` ne doit rester en production.

## Design et contenu

Direction : agriculture contemporaine, chaleureuse et concrète. La palette distingue les roles : vert producteur, bleu acheteur, orange transporteur et jaune paiement.

Les visuels doivent montrer le produit et l'usage réel : récolte, produits identifiables, téléphone, commande, transporteur et livraison. Eviter les images agricoles génériques, les chiffres non verifies et les promesses de livraison instantanée.

## Securite et donnees personnelles

- Ne pas exposer de secret dans le bundle client ou les variables publiques.
- Obtenir un consentement explicite avant l'inscription à la waitlist.
- Ajouter politique de confidentialité et durée de conservation.
- Minimiser les données collectées.
- Protéger le formulaire par rate limiting, honeypot ou challenge progressif.
- Normaliser les emails et empêcher les doubles inscriptions.
- Valider les données côté serveur.
- Configurer CSP, HSTS en production, Referrer-Policy, Permissions-Policy et frame-ancestors.
- Ne pas logger les emails, noms ou payloads complets.

## Tests et release

Avant publication :

```bash
pnpm lint
pnpm build
```

Tester manuellement et automatiquement :

- affichage desktop, mobile et largeur 320 px ;
- navigation clavier et lecteurs d'écran ;
- FAQ ;
- formulaire valide, invalide, en chargement, succès, erreur et doublon ;
- changement FR/EN ;
- metadata et aperçu social ;
- liens, images, fonts et headers ;
- perte réseau et double clic sur le formulaire.

Déployer uniquement après validation de [README_TACHES_LANDING.md](README_TACHES_LANDING.md), avec variables staging/production séparées et rollback disponible.

## Convention Git

Format de branche : `type/domaine-ticket-description`.

```text
feat/landing-LAND-P0-002-waitlist-api
feat/landing-LAND-P1-001-i18n
security/landing-SEC-LAND-P0-001-consent
fix/landing-LAND-P0-001-build
```

Format de commit : `type(scope): action courte [TICKET]`.

```text
feat(waitlist): connect signup endpoint [LAND-P0-002]
fix(a11y): make FAQ keyboard accessible [QA-LAND-P1-002]
```

## Definition de fini

- Lint et build passent en CI.
- La waitlist est réellement branchée et protégée.
- FR/EN couvre tout le contenu.
- SEO, accessibilité, performance et headers sont validés.
- Aucun secret ou donnée personnelle inutile n'est exposé.
- Les promesses de la page correspondent aux fonctionnalités réellement disponibles dans le mobile et le backend.
