defmodule Techtree.Repo.Migrations.AddProjectContributors do
  use Ecto.Migration

  def change do
    create table(:project_contributors, primary_key: false) do
      add :project_id, references(:projects, on_delete: :delete_all),
                     null: false

      add :contributor_id, references(:contributors, on_delete: :delete_all),
                     null: false
    end

    create unique_index(:project_contributors, [:project_id, :contributor_id])
  end
end
