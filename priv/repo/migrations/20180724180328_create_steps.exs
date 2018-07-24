defmodule Techtree.Repo.Migrations.CreateSteps do
  use Ecto.Migration

  def change do
    create table(:steps) do
      add :title, :string
      add :description, :text
      add :project_id, references(:projects, on_delete: :delete_all),
                       null: false

      timestamps()
    end

    create index(:steps, [:project_id])
  end
end
