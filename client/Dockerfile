FROM node:22-alpine
WORKDIR /app

# 1. On copie le dossier partagé ET le dossier client
COPY shared ./shared
COPY client ./client

# (Optionnel : Si tu utilises les workspaces npm, décommente la ligne ci-dessous)
# COPY package*.json ./ 

# 2. On se place dans le client et on installe (il trouvera le dossier shared juste au-dessus)
WORKDIR /app/client
RUN npm install

# 3. On build le projet Next.js
RUN npm run build

EXPOSE 3000

# 4. On lance le serveur de production
CMD ["npm", "start"]
