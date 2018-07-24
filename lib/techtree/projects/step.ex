defmodule Techtree.Projects.Step do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.Project

  schema "steps" do
    field :description, :string
    field :title, :string
    belongs_to :project, Project

    timestamps()
  end

  @doc false
  def changeset(step, attrs) do
    step
    |> cast(attrs, [:title, :description])
    |> validate_required([:title, :description])
  end
end
