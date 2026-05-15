FROM node:20-alpine

WORKDIR /app

# Copie uniquement les fichiers de dépendances d'abord (pour le cache Docker)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Installation propre
RUN npm ci

# Génération du client Prisma
RUN npx prisma generate

# Copie du reste du code source
COPY . .

# Build du code TypeScript (si tu as un script de build)
RUN npm run build

# Exposition du port Socket.io (3001 par défaut)
EXPOSE 3001

# Lancement du serveur
CMD ["npm", "start"]
