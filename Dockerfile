FROM oven/bun:1
WORKDIR /trivia-mania-api
COPY . /trivia-mania-api
RUN bun install

ARG PORT
EXPOSE 3000

CMD ["bun", "src/index.ts"]
