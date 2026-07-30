# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Use a relative API base; nginx proxies /v1 to the backend service.
ENV VITE_API_URL=/v1
RUN npm run build

# --- runtime stage (nginx serves static + proxies /v1) ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
