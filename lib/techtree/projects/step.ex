defmodule Techtree.Projects.Step do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.{Dependency, Project, Step, StepState}

  schema "steps" do
    field :description, :string
    field :title, :string
    field :state, StepState
    belongs_to :project, Project
    many_to_many :dependencies, Step, join_through: "dependencies",
                                      join_keys: [depender_id: :id, depended_id: :id]

    timestamps()
  end

  def finished?(%Step{ state: state }) do
    case state do
      :to_do -> false
      :work_in_progress -> false
      :completed -> true
      :archived -> true
    end
  end

  @doc false
  def changeset(step, attrs) do
    step
    |> cast(attrs, [:title, :description, :state])
    |> validate_required([:title])
  end
end
