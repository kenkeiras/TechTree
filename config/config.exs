# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :techtree,
  ecto_repos: [Techtree.Repo]

# Configures the endpoint
config :techtree, TechtreeWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "iS2ky/truTo66A/Fuaxp4Xo4ZDCKrsZE2oExhQgk518Tj7KD3n3l96a0Us9vtOJm",
  render_errors: [view: TechtreeWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Techtree.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:user_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
