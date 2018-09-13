defmodule TechtreeWeb do
  @moduledoc """
  The entrypoint for defining your web interface, such
  as controllers, views, channels and so on.

  This can be used in your application as:

      use TechtreeWeb, :controller
      use TechtreeWeb, :view

  The definitions below will be executed for every view,
  controller, etc, so keep them short and clean, focused
  on imports, uses and aliases.

  Do NOT define functions inside the quoted expressions
  below. Instead, define any helper function in modules
  and import those modules here.
  """

  def controller do
    quote do
      use Phoenix.Controller, namespace: TechtreeWeb
      import Plug.Conn
      import TechtreeWeb.Router.Helpers
      import TechtreeWeb.Gettext
    end
  end

  def view do
    quote do
      use Phoenix.View, root: "lib/techtree_web/templates",
                        namespace: TechtreeWeb

      # Import convenience functions from controllers
      import Phoenix.Controller, only: [get_flash: 2, view_module: 1]

      # Use all HTML functionality (forms, tags, etc)
      use Phoenix.HTML

      import TechtreeWeb.Router.Helpers
      import TechtreeWeb.ErrorHelpers
      import TechtreeWeb.Gettext

      def is_logged(conn) do
        Plug.Conn.get_session(conn, :user_id) != nil
      end

      def render("section_title_header.html", %{ project: project }) do
        "#{project.name} @ TechTree"
      end

      def render("section_title_header.html", _) do
        "TechTree"
      end

      def render("section_subtitle_header.html", %{ project: project, conn: conn }) do
        name = Phoenix.HTML.safe_to_string(Phoenix.HTML.html_escape(project.name))
        {:safe, "<span class=\"subtitle editable\">#{name}</span>"}
      end

      def render("section_subtitle_header.html", _) do
        "TechTree"
      end

    end
  end

  def router do
    quote do
      use Phoenix.Router
      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
      import TechtreeWeb.Gettext
    end
  end

  @doc """
  When used, dispatch to the appropriate controller/view/etc.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
