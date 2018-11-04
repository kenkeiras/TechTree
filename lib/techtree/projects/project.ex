defmodule Techtree.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.{Contributor, Step}

  schema "projects" do
    field :name, :string
    belongs_to :owner, Contributor
    has_many :steps, Step
    field :completed, :boolean, virtual: true
    field :public_visible, :boolean

    many_to_many(:contributors, Contributor,
      join_through: "project_contributors",
      join_keys: [project_id: :id, contributor_id: :id]
    )

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :public_visible])
    |> validate_required([:name])
  end
end
