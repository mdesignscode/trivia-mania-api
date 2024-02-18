FROM oven/bun:1
WORKDIR /app

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

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
