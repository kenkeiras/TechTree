defmodule TechtreeWeb.Router do
  use TechtreeWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", TechtreeWeb do
    pipe_through :browser # Use the default browser stack

    get "/", IndexRedirectionController, :index

    resources "/users", UserController, only: [:new, :create]
    resources "/sessions", SessionController, only: [:new, :create, :delete],
                                              singleton: true
  end

  scope "/projects", TechtreeWeb.Projects, as: :project do
    pipe_through [:browser, :authenticate_user]

    resources "/", ProjectController, param: "project_id", except: [:show]
    get "/new/import", ProjectController, :import
    post "/new/import", ProjectController, :new_import
    get "/:project_id/export", ProjectController, :export

  end

  # Services usable without needed authentication
  scope "/", TechtreeWeb.Projects, as: :project do
    pipe_through [:browser, :try_authenticate_user]

    resources "/projects/", ProjectController, param: "project_id", only: [:show]
    get "/api/projects/:project_id/dependencies", DependencyController, :dependency_graph
  end

  scope "/api/projects/", TechtreeWeb.Projects, as: :project do
    pipe_through [:browser, :api, :authenticate_user]

    patch "/:project_id", ProjectController, :api_patch

    post "/:project_id/steps/", StepController, :api_create
    patch "/:project_id/steps/:step_id", StepController, :api_patch
    delete "/:project_id/steps/:step_id", StepController, :api_remove

    get "/:project_id/steps/:step_id/dependencies", DependencyController, :get_step_dependencies
    put "/:project_id/steps/:step_id/dependencies/:depended_id", DependencyController, :add_dependency
    delete "/:project_id/steps/:step_id/dependencies/:depended_id", DependencyController, :remove_dependency

    # Project contributors
    get "/:project_id/contributors", ProjectContributorsController, :index
  end

  defp authenticate_user(conn, _) do
    authenticate_user(conn)
  end

  def authenticate_user(conn) do
    case get_session(conn, :user_id) do
      nil ->
        conn
        |> Phoenix.Controller.put_flash(:error, "Login required")
        |> Phoenix.Controller.redirect(to: "/")
        |> halt()
      user_id ->
        assign(conn, :current_user, Techtree.Accounts.get_user!(user_id))
    end
  end

  defp try_authenticate_user(conn, _) do
    case get_session(conn, :user_id) do
      nil ->
        conn
      user_id ->
        assign(conn, :current_user, Techtree.Accounts.get_user!(user_id))
    end
  end

  # Other scopes may use custom stacks.
  # scope "/api", TechtreeWeb do
  #   pipe_through :api
  # end
end
