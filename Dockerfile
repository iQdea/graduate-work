# syntax = docker/dockerfile:experimental

FROM node:18-alpine3.14 as base_dependencies

ARG CI=true

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --production --frozen-lockfile

FROM base_dependencies as dev_dependencies
ARG CI=true
RUN yarn --frozen-lockfile && rm -rf `yarn cache dir`

FROM dev_dependencies as source
COPY . .

FROM source as lint
RUN yarn run lint

FROM source as test
RUN yarn run test

FROM source as builder
RUN yarn run build

FROM node:18-alpine3.14 as release
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 && apk update && apk add postgresql-client
WORKDIR /app

COPY diplom/gitlab/review_create_db.sh ./

COPY --from=base_dependencies /app/package.json ./package.json
COPY --from=base_dependencies /app/yarn.lock ./yarn.lock

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

USER nodeuser

ENV NODE_ENV production
ENV PORT 3000
EXPOSE $PORT

CMD ["node", "dist/main"]
