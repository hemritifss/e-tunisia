# Déployer le backend e-Tunisia (gratuit) — sur Render

> **Pourquoi pas Vercel pour le backend ?**
> Vercel = *serverless* (fonctions courtes, pas de process permanent). Le backend
> e-Tunisia a besoin d'un **process toujours allumé** : WebSockets (chat/stories en
> temps réel via socket.io), **files d'attente BullMQ** (workers en arrière-plan),
> **Redis** et une **connexion Postgres persistante**. Vercel ne sait pas faire ça.
> → Le **frontend reste sur Vercel**, le **backend va sur Render** (le meilleur host
> gratuit qui gère Docker + Postgres + Redis au même endroit).

---

## Ce que j'ai déjà préparé (le code est prêt)

- `render.yaml` — un **Blueprint** : crée en 1 clic l'API + Postgres + Redis, tout câblé.
- `backend/src/database/database.config.ts` — supporte `DB_SYNCHRONIZE=true` (crée le
  schéma automatiquement au premier boot, vu qu'il n'y a pas encore de migrations).
- `backend/src/common/validation/env.validation.ts` — les intégrations optionnelles
  (Google, S3, Stripe…) ne bloquent plus le démarrage ; elles se dégradent en douceur.
- Des **clés VAPID réelles** (web-push) déjà mises dans le blueprint → notifications OK.
- `dist/` reconstruit pour refléter ces changements.

## Ce que TU dois faire (je ne peux pas créer le compte à ta place)

Créer un compte demande **ton email + vérification + autorisation GitHub + accepter
les conditions** — c'est lié à ton identité, un assistant ne peut pas le faire. Mais
c'est 5 minutes de clics. Voilà :

### 1. Pousser le code sur GitHub
Le blueprint déploie depuis la branche `main`. Commit + push ce qui est préparé :

```bash
git add render.yaml DEPLOY.md backend/src backend/dist
git commit -m "chore(deploy): Render blueprint for the backend"
git push origin main     # ou pousse ta branche puis change `branch:` dans render.yaml
```

### 2. Créer le compte Render
- Va sur **https://render.com** → **Get Started** → **Sign in with GitHub**.
- Autorise Render à voir ton repo `hemritifss/e-tunisia`.
- (Gratuit, pas de carte bancaire pour le plan free.)

### 3. Déployer le Blueprint
- Dashboard Render → bouton **New +** → **Blueprint**.
- Choisis le repo **e-tunisia** → Render lit `render.yaml` tout seul.
- Il te montre 3 ressources (etunisia-api, etunisia-db, etunisia-redis) → clique **Apply**.
- Attends ~3–6 min (build Docker + création DB/Redis).

### 4. Récupérer l'URL
Ton API sera sur : **https://etunisia-api.onrender.com**
Vérifie :
- `https://etunisia-api.onrender.com/health` → doit répondre (status ok).
- `https://etunisia-api.onrender.com/api/docs` → Swagger.

### 5. Brancher le frontend (Vercel) sur cette API
Dans les **Environment Variables** de ton projet Vercel, mets l'URL de l'API
(ex. `VITE_API_URL=https://etunisia-api.onrender.com`) puis **Redeploy**.
> Vérifie le nom exact de la variable dans `web/src/api.ts`.

---

## À savoir (limites du gratuit)

- 😴 **Cold start** : le service free s'endort après 15 min sans trafic ; la 1ʳᵉ requête
  après réveil prend ~30–50 s. Normal sur le plan gratuit.
- 🗄️ **Postgres free expire ~30 jours** (Render t'envoie un mail). Pour du permanent :
  Neon (gratuit, ne s'éteint pas) ou passe la DB Render en payant.
- 💾 **Uploads** : sans S3 configuré, les fichiers vont sur le disque local **éphémère**
  (perdus au redéploiement). Pour du permanent : Cloudflare R2 (10 Go gratuits) ou
  Supabase Storage → mets `S3_ENDPOINT / S3_ACCESS_KEY / S3_SECRET_KEY / S3_BUCKET`.
- 🧠 **RAM 512 Mo** : l'app est lourde. Si elle crash (OOM) dans les logs Render, passe
  le service `etunisia-api` en plan **Starter**.

## Intégrations optionnelles (à ajouter quand tu veux, dans Render → Environment)

| Fonction        | Variables                                              | Sans ça          |
|-----------------|--------------------------------------------------------|------------------|
| IA gratuite     | `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (Groq)      | IA en mode mock  |
| Google sign-in  | `GOOGLE_CLIENT_ID`                                      | bouton caché     |
| Paiements       | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`           | paiements mock   |
| Emails          | `RESEND_API_KEY`, `EMAIL_FROM`                          | log console      |

> Après tout changement dans `backend/src`, rebuild le `dist` avant de push :
> `cd backend && npm run build` (le Docker de prod déploie le `dist` déjà compilé).
