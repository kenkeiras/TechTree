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
    |> put_change(:password, hash_password(attrs["password"]))
  end

  @doc false
  defp hash_password(password) do
    Comeonin.Argon2.hashpwsalt(password)
  end

  def check(tested_password, %{ :password => hash }) do
    Comeonin.Argon2.checkpw(tested_password, hash)
  end
end
