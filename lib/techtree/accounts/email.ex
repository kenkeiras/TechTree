defmodule Techtree.Accounts.Email do
  use Ecto.Schema
  import Ecto.Changeset

  alias Techtree.Accounts.User

  schema "emails" do
    field :email, :string
    belongs_to :user, User

    timestamps()
  end

  @doc false
  def changeset(email, attrs) do
    email
    |> cast(attrs, [:email])
    |> validate_required([:email])
    |> unique_constraint(:email)
    |> validate_format(:email, ~r/@/)
  end
end
