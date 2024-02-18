FROM oven/bun:1
WORKDIR /app

RUN echo ":::::::::::::::::::::::::::::::::::::::::"
RUN pwd
RUN ls

COPY . .

RUN bun install

RUN echo ":::::::::::::::::::::::::::::::::::::::::"
RUN pwd
RUN ls prisma

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["bun", "src/index.ts"]
