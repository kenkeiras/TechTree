defmodule Techtree.Repo.Migrations.AddProjectVisibility do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :public_visible, :boolean, null: false, default: false
    end
  end
end
