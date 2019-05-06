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
    Argon2.hash_pwd_salt(password)
  end

  def check(tested_password, %{ :password => hash }) do
    Argon2.verify_pass(tested_password, hash)
  end
end
