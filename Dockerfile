FROM oven/bun:1.3.13-alpine

WORKDIR /app

COPY . .

RUN bun install

CMD [ "bun", "run", "dev" ]
EXPOSE 5173