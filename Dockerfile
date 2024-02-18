FROM oven/bun:1
WORKDIR /app

# Install Node.js and npm
RUN apt-get update && apt-get install -y curl bash

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

COPY . .

RUN bun install

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["bun", "src/index.ts"]
