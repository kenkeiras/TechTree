defmodule Techtree.Repo.Migrations.AllowMultipleStates do
  use Ecto.Migration

  alias Techtree.Repo
  alias Techtree.Projects.{Step, StepState}

  def translate_states() do
    Enum.each(
      Step
      |> Repo.all(),
      fn step ->
        translate_step(step)
      end
    )
  end

  def translate_step(step) do
    step
    |> Step.changeset(%{state: calculate_state(step)})
    |> Repo.update!()
  end

  def calculate_state(%Step{completed: false}) do
    :to_do
  end

  def calculate_state(%Step{completed: true}) do
    :completed
  end

  def up do
    StepState.create_type()

    alter table(:steps) do
      add(:state, :step_state, null: false, default: "to_do")
    end

    flush()

    translate_states()

    flush()
  end

  def down do
    alter table(:steps) do
      remove(:state)
    end

    StepState.drop_type()
  end
end
