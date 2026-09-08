# Configuration Supabase

## 1. Creer le projet

Dans Supabase, creez un projet puis ouvrez **SQL Editor**. Executez le contenu de `supabase/schema.sql`.

La table `waitlist_signups` contient :

- `name`
- `email` unique
- `role`
- `city`
- `locale`
- `created_at`

## 2. Ajouter les variables locales

Copiez `.env.example` vers `.env.local` et renseignez les valeurs disponibles dans **Project Settings > API** :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

La cle `SUPABASE_SERVICE_ROLE_KEY` reste uniquement côté serveur. Ne l'ajoutez jamais dans une variable `NEXT_PUBLIC_*`.

## 3. Configurer les emails et la limite

Créez une clé API dans Resend et vérifiez votre domaine d'envoi. Ajoutez ensuite dans `.env.local` :

```env
WAITLIST_LIMIT=100
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Onabaya <noreply@votre-domaine.com>
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

Après chaque nouvelle inscription, l'utilisateur reçoit sa position et un lien personnel de partage. Quand `WAITLIST_LIMIT` est atteint, les nouvelles inscriptions sont refusées.

## 4. Tester

Lancez la landing page avec `pnpm dev`, remplissez le formulaire de liste d'attente, puis verifiez la table `waitlist_signups` dans Supabase.

La route utilisée par le formulaire est `POST /api/waitlist`. Un email déjà inscrit renvoie un message adapté sans créer de doublon.
