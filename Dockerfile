FROM oven/bun:1
WORKDIR /app

RUN echo ":::::::::::::::::::::::::::::::::::::::::"
RUN pwd
RUN ls

COPY . .

RUN echo ":::::::::::::::::::::::::::::::::::::::::"
RUN pwd
RUN ls

RUN bun install

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["bun", "src/index.ts"]
