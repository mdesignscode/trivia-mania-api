FROM oven/bun:1

COPY . /trivia-mania-api

WORKDIR /trivia-mania-api

RUN bun install

ARG PORT
EXPOSE 3000

CMD ["bun", "src/index.ts"]
