defmodule Techtree.Projects.Dependency do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.Step

  schema "dependencies" do
    belongs_to :depended, Step, foreign_key: :depended_id
    has_one :depender, Step, foreign_key: :depender_id

    timestamps()
  end

  @doc false
  def changeset(dependency, attrs) do
    IO.inspect(dependency)
    IO.inspect(attrs)
    IO.inspect({123, cast(dependency, attrs, [])})
    dependency
    |> cast(attrs, [])
    # |> validate_required([:depended, :depender])
  end
end
