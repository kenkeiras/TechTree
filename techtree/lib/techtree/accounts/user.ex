defmodule Techtree.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Accounts.{Email, Password}

  schema "users" do
    field :name, :string
    field :username, :string
    has_one :email, Email
    has_one :password, Password

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :username])
    |> validate_required([:name, :username])
    |> unique_constraint(:username)
  end
end
