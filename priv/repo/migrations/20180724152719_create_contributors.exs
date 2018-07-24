defmodule Techtree.Repo.Migrations.CreateContributors do
  use Ecto.Migration

  def change do
    create table(:contributors) do
      add :role, :string
      add :user_id, references(:users, on_delete: :delete_all),
                    null: false

      timestamps()
    end

    create unique_index(:contributors, [:user_id])
  end
end
