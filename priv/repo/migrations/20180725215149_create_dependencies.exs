defmodule Techtree.Repo.Migrations.Dependencies do
  use Ecto.Migration

  def change do
    create table(:dependencies, primary_key: false) do
      add :depender_id, references(:steps, on_delete: :delete_all),
                     null: false

      add :depended_id, references(:steps, on_delete: :delete_all),
                     null: false
    end

    create unique_index(:dependencies, [:depender_id, :depended_id])
  end
end
