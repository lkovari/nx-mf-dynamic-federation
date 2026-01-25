FROM node:20-alpine

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN apk add --no-cache curl

EXPOSE 4200 4201 4202 4203

CMD ["pnpm", "start"]
