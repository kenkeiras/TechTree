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

    resources "/", ProjectController, param: "project_id"
    get "/new/import", ProjectController, :import
    post "/new/import", ProjectController, :new_import
    resources "/:project_id/steps", StepController, param: "step_id"
    get "/:project_id/export", ProjectController, :export
    post "/:project_id/steps/:step_id/state/completed", StepController, :mark_completed
    post "/:project_id/steps/:step_id/state/uncompleted", StepController, :mark_uncompleted

    resources "/:project_id/steps/:step_id/dependencies", DependencyController, param: "dependency_id"
  end

  scope "/api/projects/", TechtreeWeb.Projects, as: :project do
    pipe_through [:browser, :api, :authenticate_user]

    get "/:project_id/dependencies", DependencyController, :dependency_graph
  end

  defp authenticate_user(conn, _) do
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
  
  # Other scopes may use custom stacks.
  # scope "/api", TechtreeWeb do
  #   pipe_through :api
  # end
end