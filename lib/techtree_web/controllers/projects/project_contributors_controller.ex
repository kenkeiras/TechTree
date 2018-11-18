defmodule TechtreeWeb.Projects.ProjectContributorsController do
  use TechtreeWeb, :controller

  alias Techtree.Projects

  alias TechtreeWeb.Projects.Plugs
  alias TechtreeWeb.Projects.ProjectController

  plug(:require_existing_contributor)
  plug(:authorize_page_edition)

  defp require_existing_contributor(conn, x) do
    # TODO move to it's own module
    ProjectController.require_existing_contributor(conn, x)
  end

  defp authorize_page_edition(conn, x) do
    # TODO move to it's own module
    ProjectController.authorize_page_edition(conn, x)
  end

  def index(conn, %{"project_id" => project_id}) do
    project = Projects.get_project_with_fullcontributors(project_id)

    render(conn, "result.json", %{contributors: project.contributors})
  end

  def api_create(conn, %{"project_id" => project_id, "username" => username}) do
    contributor = Projects.get_contributor_with_username(username)
    project = Projects.get_project_with_fullcontributors(project_id)

    case Projects.project_involves_contributor(project, contributor) do
      false ->
        case Projects.add_project_contributor(project, contributor) do
          %Projects.Project{} ->
            render(conn, "operation_result.json",
              result: %{success: true, contributor: %{id: contributor.id}}
            )

          {:error, %Ecto.Changeset{} = changeset} ->
            IO.inspect(changeset)

            conn
            |> put_status(:bad_request)
            |> render("operation_result.json",
              result: %{success: false, reason: :error_on_user_data}
            )
        end

      true ->
        conn
        |> put_status(:bad_request)
        |> render("operation_result.json",
          result: %{success: false, reason: :user_already_on_project}
        )
    end
  end

  def api_remove(conn, %{"project_id" => project_id, "contributor_id" => contributor_id}) do
    Projects.remove_project_contributor(
      String.to_integer(project_id),
      String.to_integer(contributor_id)
    )

    render(conn, "operation_result.json", result: %{success: true})
  end
end
