defmodule Techtree.Projects.Contributor do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Projects.Project

  schema "contributors" do
    field :role, :string

    has_many :projects, Project
    belongs_to :user, Techtree.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(contributor, attrs) do
    contributor
    |> cast(attrs, [:role])
    |> validate_required([:role])
    |> unique_constraint(:user_id)
  end
end
