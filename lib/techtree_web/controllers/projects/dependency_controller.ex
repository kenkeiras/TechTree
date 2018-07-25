defmodule TechtreeWeb.Projects.DependencyController do
  use TechtreeWeb, :controller

  alias Techtree.Projects
  alias Techtree.Projects.Step
  alias TechtreeWeb.Projects.ProjectController

  alias TechtreeWeb.Projects.Plugs

  plug :require_existing_contributor
  plug :authorize_page

  defp require_existing_contributor(conn, x) do
    # TODO move to it's own module
    ProjectController.require_existing_contributor(conn, x)
  end

  defp authorize_page(conn, x) do
    ProjectController.authorize_page(conn, x)
  end

  def get_available_dependencies_for_step(conn, step) do
    all_steps = Projects.list_steps_in_project(conn.assigns.project)

    for other_step <- all_steps,
                      step.id != other_step.id,
                      do: {other_step.title, other_step.id}

  end

  def new(conn, %{"step_id" => step_id}) do
    step = Projects.get_step_with_project!(step_id)
    available_steps = get_available_dependencies_for_step(conn, step)

    render(conn, "new.html", step: step, available_steps: available_steps)
  end

  def create(conn, %{"dependency" => depender_id, "step_id" => step_id}) do
    step = Projects.get_step_with_project!(step_id)
    available_steps = get_available_dependencies_for_step(conn, step)
    depender = Projects.get_step!(depender_id)

    IO.puts("#{depender_id} --depends on-> #{step_id} ")
    IO.inspect(step)

    case Projects.create_dependency(step, depender) do
      %Step{} ->
        conn
        |> put_flash(:info, "Dependency added successfully.")
        |> redirect(to: project_step_path(conn, :show, conn.assigns.project.id, step_id))
      {:error, %Ecto.Changeset{} = changeset} ->
        IO.puts("ERROR:")
        IO.inspect(changeset)
        render(conn, "new.html", step: step,
                                 available_steps: available_steps, 
                                 changeset: changeset)
    end
  end

  def delete(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    {:ok, _step} = Projects.delete_step(step)

    conn
    |> put_flash(:info, "Step deleted successfully.")
    |> redirect(to: project_step_path(conn, :index, conn.assigns.project.id))
  end
end
