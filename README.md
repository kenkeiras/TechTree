# Techtree

[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=kenkeiras/TechTree)](https://dependabot.com)

To start your Phoenix server:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Install Node.js dependencies with `cd assets && npm install`
  * Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](http://www.phoenixframework.org/docs/deployment).

## Fast configuration & deploy

To build a docker and deploy it there (with a corresponding one for the DB) 
do the following

```bash
# Build docker image
docker -t techtree .
# Launch docker image and database
sh launch-docker.sh
```

## TechTree plan on TechTree

You can check this project TechTree on https://techtree.spiral.systems/projects/2 .

## References

### More about phoenix framework

  * Official website: http://www.phoenixframework.org/
  * Guides: http://phoenixframework.org/docs/overview
  * Docs: https://hexdocs.pm/phoenix
  * Mailing list: http://groups.google.com/group/phoenix-talk
  * Source: https://github.com/phoenixframework/phoenix
