defmodule Techtree.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.Contributor

  schema "projects" do
    field :name, :string
    belongs_to :contributor, Contributor

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
