defmodule Techtree.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.{Contributor, Step}

  schema "projects" do
    field :name, :string
    belongs_to :contributor, Contributor
    has_many :steps, Step
    field :completed, :boolean, virtual: true

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
