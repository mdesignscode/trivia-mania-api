FROM oven/bun:1
WORKDIR /
COPY . .
RUN bun install

ARG PORT
EXPOSE 3000

CMD ["bun", "src/index.ts"]
