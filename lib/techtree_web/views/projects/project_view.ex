defmodule TechtreeWeb.Projects.ProjectView do
  use TechtreeWeb, :view

  alias Techtree.Projects

  def author_name(%Projects.Project{ owner: owner }) do
    owner.user.name
  end

  def render("section_title_completion.css", %{ project: project }) do
    if project.completed do
      "completed"
    else
      ""
    end
  end

  def render("navbar_buttons.html", %{ conn: conn, project: project }) do
    export_url = project_project_path(conn, :export, project)

    ~E{
      <div class="nav-buttons">
        <div class="dropdown btn-group">
            <button type="button" data-toggle="dropdown" class="nav-button dropdown-toggle visibility-dropdown-button">
            <%= if project.public_visible do %>
                  <i class="glyphicon glyphicon-eye-open"></i>
                  Public
              <% else %>
                  <i class="glyphicon glyphicon-lock"></i>
                  Private
              <% end %>
              <i class="glyphicon glyphicon-menu-down"></i>
            </button>
            <ul class="dropdown-menu" role="menu">
              <%= if project.public_visible do %>
                <li>
                  <a href="#" class="set-project-visibility-private">
                    <i class="glyphicon glyphicon-lock"></i>
                    Make private
                  </a>
                </li>
              <% else %>
                <li>
                  <a href="#" class="set-project-visibility-public">
                    <i class="glyphicon glyphicon-eye-open"></i>
                    Make public
                  </a>
                </li>
              <% end %>
            </ul>
        </div>

        <button class="nav-button add-step-button">Add step [⌨ a]</button>
        <a target="_blank" href="<%= export_url %>" class="nav-button export-project-button">
          Export project
        </a>
      </div>
      }
  end

  def render("result.json", %{result: result}) do
    result
  end

  def render("export-project.json", %{project: project}) do
    %{
      steps: render_many(project.steps,
                         TechtreeWeb.Projects.DependencyView,
                         "single_step.json"),
      name: project.name
    }
  end
end
