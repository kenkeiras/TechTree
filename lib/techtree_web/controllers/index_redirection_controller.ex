defmodule TechtreeWeb.IndexRedirectionController do
  use TechtreeWeb, :controller

  def index(conn, _params) do
    case get_session(conn, :user_id) do
      nil ->
        redirect(conn, to: session_path(conn, :new))

      _user_id ->
        redirect(conn, to: project_project_path(conn, :index))
    end
  end
end
