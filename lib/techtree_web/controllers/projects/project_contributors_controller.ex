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
end
