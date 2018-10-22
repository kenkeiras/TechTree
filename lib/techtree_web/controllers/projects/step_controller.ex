defmodule TechtreeWeb.Projects.StepController do
  use TechtreeWeb, :controller

  alias Techtree.Projects
  alias Techtree.Projects.Step
  alias TechtreeWeb.Projects.ProjectController

  alias TechtreeWeb.Projects.Plugs

  plug :require_existing_contributor

  plug :authorize_page_visibility when action in [:show]
  plug :authorize_page_edition when action in [
    :new, :create,
    :edit, :mark_completed, :mark_uncompleted,
    :update, :delete,
    :api_remove, :api_patch, :api_create
  ]

  defp require_existing_contributor(conn, x) do
    # TODO move to it's own module
    ProjectController.require_existing_contributor(conn, x)
  end

  defp authorize_page_visibility(conn, x) do
    ProjectController.authorize_page_visibility(conn, x)
  end

  defp authorize_page_edition(conn, x) do
    ProjectController.authorize_page_edition(conn, x)
  end

  def new(conn, _params) do
    changeset = Projects.change_step(%Step{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"step" => step_params}) do
    case Projects.create_step(conn.assigns.current_contributor, conn.assigns.project, step_params) do
      {:ok, step} ->
        conn
        |> put_flash(:info, "Step created successfully.")
        |> redirect(to: project_step_path(conn, :show, conn.assigns.project.id, step))
      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"step_id" => id}) do
    step = Projects.get_step_with_dependencies!(id)
    render(conn, "show.html", step: step)
  end

  def edit(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    changeset = Projects.change_step(step)
    render(conn, "edit.html", step: step, changeset: changeset)
  end

  ## TODO : Refactor marking as completed/uncomplete
  def mark_completed(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    case Projects.update_step(step, %{ "completed" => true }) do
      {:ok, step} ->
        conn
        |> put_flash(:info, "Step updated successfully.")
        |> redirect(to: project_step_path(conn, :show, conn.assigns.project.id, step))

      {:error, %Ecto.Changeset{} = changeset} ->
          render(conn, "edit.html", step: step, changeset: changeset)
      end
    end

  def mark_uncompleted(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    case Projects.update_step(step, %{ "completed" => false }) do
      {:ok, step} ->
        conn
        |> put_flash(:info, "Step updated successfully.")
        |> redirect(to: project_step_path(conn, :show, conn.assigns.project.id, step))

      {:error, %Ecto.Changeset{} = changeset} ->
          render(conn, "edit.html", step: step, changeset: changeset)
      end
    end

    def update(conn, %{"step_id" => id, "step" => step_params}) do
    step = Projects.get_step!(id)

    case Projects.update_step(step, step_params) do
      {:ok, step} ->
        conn
        |> put_flash(:info, "Step updated successfully.")
        |> redirect(to: project_step_path(conn, :show, conn.assigns.project.id, step))
      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "edit.html", step: step, changeset: changeset)
    end
  end

  def delete(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    {:ok, _step} = Projects.delete_step(step)

    conn
    |> put_flash(:info, "Step deleted successfully.")
    |> redirect(to: project_project_path(conn, :show, conn.assigns.project.id))
  end

  def api_remove(conn, %{"step_id" => id}) do
    step = Projects.get_step!(id)
    {:ok, _step} = Projects.delete_step(step)

    render(conn, "operation_result.json", result: %{success: true})
  end

  def api_patch(conn, %{ "step_id" => step_id, "state" => new_state }) do
    step = Projects.get_step!(step_id)
    patch = Projects.gen_step_patch(new_state)
    Projects.update_step(step, patch)

    render(conn, "operation_result.json", result: %{success: true})
  end

  def api_create(conn, %{"step" => step_params}) do
    case Projects.create_step(conn.assigns.current_contributor, conn.assigns.project, step_params) do
      {:ok, step} ->
        render(conn, "operation_result.json", result: %{success: true})
      {:error, %Ecto.Changeset{} = changeset} ->
        IO.puts("----  ERROR ----")
        IO.inspect(changeset)
        IO.puts("---- /ERROR ----")
        conn
        |> put_status(:bad_request)
        |> render("operation_result.json", result: %{success: false})
    end
  end
end
