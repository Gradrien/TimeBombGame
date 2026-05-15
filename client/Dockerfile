# ==========================================
# 1. ÉTAPE DES DÉPENDANCES
# ==========================================
FROM node:22-alpine AS deps
WORKDIR /app

# Installation de libc6-compat (souvent requis par certains paquets Node sur Alpine)
RUN apk add --no-cache libc6-compat

# Copie uniquement des fichiers de dépendances
COPY package.json ./
RUN npm install

# ==========================================
# 2. ÉTAPE DE BUILD
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# On récupère les dépendances de l'étape 1
COPY --from=deps /app/node_modules ./node_modules
# On copie tout le reste du code source
COPY . .

# Variables d'environnement de build (optionnel mais utile si tu en as)
# ENV NEXT_PUBLIC_SOCKET_URL=https://api.tondomaine.com

RUN npm run build

# ==========================================
# 3. ÉTAPE DE PRODUCTION (Runner)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Création d'un utilisateur non-root pour des raisons de sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# On copie le dossier public (images, fonts)
COPY --from=builder /app/public ./public

# On copie UNIQUEMENT le dossier standalone généré par Next.js à l'étape 1
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Next.js standalone génère un server.js à la racine
CMD ["node", "server.js"]
