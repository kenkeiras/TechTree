use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :techtree, TechtreeWeb.Endpoint,
  http: [port: 4001],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :techtree, Techtree.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: "postgres",
  password: "postgres",
  database: "techtree_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox

# During tests (and tests only), reduce the number of rounds
# so it does not slow down the test suite.
config :argon2_elixir,
  t_cost: 1,
  m_cost: 8
