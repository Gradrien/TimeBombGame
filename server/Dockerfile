FROM node:22-alpine
WORKDIR /app

# 1. On copie le dossier partagé ET le dossier serveur
COPY shared ./shared
COPY server ./server

# 2. On se place dans le serveur et on installe
WORKDIR /app/server
RUN npm install

# 3. On génère le client Prisma (indispensable)
RUN npx prisma generate

# 4. Build du TypeScript (à décommenter si tu as un script "build" dans le package.json du serveur)
# RUN npm run build

EXPOSE 3001

# 5. On lance le serveur
CMD ["npm", "start"]
