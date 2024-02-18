FROM oven/bun:1

COPY . /trivia-mania-api

WORKDIR /trivia-mania-api

RUN bun install

ARG PORT
EXPOSE 3000

RUN "bun prisma generate"

CMD ["bun", "src/index.ts"]
