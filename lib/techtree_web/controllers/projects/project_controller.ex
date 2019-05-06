defmodule TechtreeWeb.Projects.ProjectController do
  use TechtreeWeb, :controller

  alias Techtree.Projects

  plug :require_existing_contributor when action not in [:show]
  plug :require_existing_contributor_visibility when action in [:show]
  plug :authorize_page_visibility when action in [:show]
  plug :authorize_page_edition when action in [:edit, :update, :delete, :api_patch]

  def require_existing_contributor(conn, _) do
    contributor = Projects.ensure_contributor_exists(conn.assigns.current_user)
    assign(conn, :current_contributor, contributor)
  end

  def require_existing_contributor_visibility(conn = %Plug.Conn{assigns: %{current_user: _}}, extra) do
    require_existing_contributor(conn, extra)
  end

  def require_existing_contributor_visibility(conn, extra) do
    project = Projects.get_project!(conn.params["project_id"])

    if not project.public_visible do
      # Authentication failure
      TechtreeWeb.Router.authenticate_user(conn)
    else
      conn
    end
  end

  def authorize_page_visibility(conn, _) do
    project = Projects.get_project!(conn.params["project_id"])

    if project.public_visible or conn.assigns.current_contributor.id == project.owner_id or
         MapSet.member?(
           Projects.get_project_contributor_set(conn.params["project_id"]),
           conn.assigns.current_contributor.id
         ) do
      assign(conn, :project, project)
    else
      conn
      |> put_flash(:error, "You can't view this project")
      |> redirect(to: project_project_path(conn, :index))
      |> halt()
    end
  end

  def authorize_page_edition(conn, _) do
    project = Projects.get_project!(conn.params["project_id"])

    if conn.assigns.current_contributor.id == project.owner_id or
         MapSet.member?(
           Projects.get_project_contributor_set(conn.params["project_id"]),
           conn.assigns.current_contributor.id
         ) do
      assign(conn, :project, project)
    else
      conn
      |> put_flash(:error, "You can't edit this project")
      |> redirect(to: project_project_path(conn, :index))
      |> halt()
    end
  end

  def index(conn, _params) do
    projects = Projects.list_projects(conn.assigns.current_contributor)
    render(conn, "index.html", projects: projects)
  end

  def new(conn, _params) do
    changeset = Projects.change_project(%Projects.Project{})
    render(conn, "new.html", changeset: changeset)
  end

  def import(conn, _params) do
    render(conn, "import.html")
  end

  def new_import(conn, %{ "name" => "" }) do
    conn
    |> put_flash(:error, "Empty project name.")
    |> redirect(to: project_project_path(conn, :import))
  end

  def new_import(conn, %{ "name" => "" }) do
    conn
    |> put_flash(:error, "Empty project name.")
    |> redirect(to: project_project_path(conn, :import))
  end

  def new_import(conn, %{ "file" => %Plug.Upload{ path: path }, "name" => name }) do
    case Projects.import_project_from_file(conn, name, path) do
      {:ok, project} ->
        conn
        |> put_flash(:info, "Project imported successfully.")
        |> redirect(to: project_project_path(conn, :show, project))
      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def new_import(conn, _) do
    conn
    |> put_flash(:error, "No project data.")
    |> redirect(to: project_project_path(conn, :import))
  end

  def create(conn, %{ "project" => project_params }) do
    case Projects.create_project(conn.assigns.current_contributor, project_params) do
      {:ok, project} ->
        conn
        |> put_flash(:info, "Project created successfully.")
        |> redirect(to: project_project_path(conn, :show, project))
      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def has_edition_permissions?(
        conn = %Plug.Conn{assigns: %{current_user: current_user}},
        %Projects.Project{owner: owner}
      ) do
    current_user.id == owner.user_id or
      MapSet.member?(
        Projects.get_project_contributor_set(conn.params["project_id"]),
        conn.assigns.current_contributor.id
      )
  end

  def has_edition_permissions?(%Plug.Conn{}, %Projects.Project{}) do
    false
  end

  def show(conn, %{"project_id" => id}) do
    project = Projects.get_project_with_steps!(id)
    render(conn, "show.html", project: project, can_edit: has_edition_permissions?(conn, project))
  end

  def export(conn, %{"project_id" => id}) do
    project = Projects.get_full_project!(id)

    conn
    |> Plug.Conn.put_resp_header("content-disposition", ~s(attachment; filename="#{project.name}-export.json"))
    |> render("export-project.json", project: project)
  end

  def edit(conn, _) do
    changeset = Projects.change_project(conn.assigns.project)
    render(conn, "edit.html", changeset: changeset)
  end

  def api_patch(conn, %{ "name" => nil }) do
    conn
    |> put_status(:precondition_failed)
    |> render("result.json", %{result: %{ success: false}})
  end

  def api_patch(conn, %{ "name" => "" }) do
    conn
    |> put_status(:precondition_failed)
    |> render("result.json", %{result: %{ success: false}})
  end

  def api_patch(conn, %{ "name" => name }) do
    case Projects.update_project(conn.assigns.project, %{ "name" => name }) do
      {:ok, project} ->
        conn
        |> render("result.json", %{result: %{ success: true}})
      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:internal_server_error)
        |> render("result.json", %{result: %{ success: false}})
    end
  end

  def api_patch(conn, %{ "visibility" => "public" }) do
    case Projects.update_project(conn.assigns.project, %{ "public_visible" => true }) do
      {:ok, project} ->
        conn
        |> render("result.json", %{result: %{ success: true}})
      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:internal_server_error)
        |> render("result.json", %{result: %{ success: false}})
    end
  end

  def api_patch(conn, %{ "visibility" => "private" }) do
    case Projects.update_project(conn.assigns.project, %{ "public_visible" => false }) do
      {:ok, project} ->
        conn
        |> render("result.json", %{result: %{ success: true}})
      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:internal_server_error)
        |> render("result.json", %{result: %{ success: false}})
    end
  end

  def update(conn, %{ "project" => project_params}) do
    case Projects.update_project(conn.assigns.project, project_params) do
      {:ok, project} ->
        conn
        |> put_flash(:info, "Project updated successfully.")
        |> redirect(to: project_project_path(conn, :show, project))
      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, "edit.html", changeset: changeset)
    end
  end

  def delete(conn, _) do
    {:ok, _project} = Projects.delete_project(conn.assigns.project)

    conn
    |> put_flash(:info, "Project deleted successfully.")
    |> redirect(to: project_project_path(conn, :index))
  end
end
