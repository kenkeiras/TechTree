defmodule Techtree.Repo.Migrations.AllowMultipleStates do
  use Ecto.Migration

  alias Techtree.Projects.StepState

  def change do
    StepState.create_type()

    alter table(:steps) do
      add(:state, :step_state, null: false, default: "to_do")
    end
  end
end
