defmodule Techtree.Repo.Migrations.AddContributorIdToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :contributor_id, references(:contributors, on_delete: :delete_all),
                           null: false
    end

    create index(:projects, [:contributor_id])
  end
end
