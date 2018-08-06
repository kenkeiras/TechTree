defmodule Techtree.Repo.Migrations.AddCompletedsteps do
  use Ecto.Migration

  def change do
    alter table(:steps) do
      add :completed, :boolean, null: false, default: false
    end
  end
end
