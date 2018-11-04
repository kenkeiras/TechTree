defmodule Techtree.Repo.Migrations.RenameProjectContributorToOwner do
  use Ecto.Migration

  def change do
    rename(table(:projects), :contributor_id, to: :owner_id)
  end
end
