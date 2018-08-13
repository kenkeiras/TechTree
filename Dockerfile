## Builder stage
FROM elixir:alpine as builder
RUN apk --no-cache add ca-certificates
WORKDIR /app/

# Install hex
RUN mix local.hex --force

# Install rebar
RUN mix local.rebar --force

# Install the Phoenix framework itself
RUN mix archive.install --force https://github.com/phoenixframework/archives/raw/master/phoenix_new.ez

# Install NodeJS 6
RUN apk add npm
RUN apk add alpine-sdk erlang-dev

# Set /app as workdir
WORKDIR /app

COPY . /app

# Get dependencies
RUN mix deps.get

WORKDIR /app/assets
RUN npm install
WORKDIR /app

RUN MIX_ENV=prod mix release.init
RUN MIX_ENV=prod mix release --executable

## Runner stage
FROM elixir:alpine as runner
RUN apk --no-cache add ca-certificates bash

WORKDIR /app

COPY --from=builder /app/_build/prod/rel/techtree /app

CMD ["bin/techtree", "foreground"]