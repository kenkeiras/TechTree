defmodule Techtree.Accounts.Password do
  use Ecto.Schema
  import Ecto.Changeset


  schema "passwords" do
    field :password, :string
    belongs_to :user, User

    timestamps()
  end

  @doc false
  def changeset(password, attrs) do
    password
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> unique_constraint(:password)
  end
end
