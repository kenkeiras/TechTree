defmodule Techtree.Projects.Step do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.{Dependency, Project, Step}

  schema "steps" do
    field :description, :string
    field :title, :string
    belongs_to :project, Project
    many_to_many :dependencies, Step, join_through: "dependencies",
                                      join_keys: [depended_id: :id, depender_id: :id]

    timestamps()
  end

  @doc false
  def changeset(step, attrs) do
    step
    |> cast(attrs, [:title, :description])
    |> validate_required([:title, :description])
  end
end
