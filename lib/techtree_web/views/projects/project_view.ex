defmodule TechtreeWeb.Projects.ProjectView do
  use TechtreeWeb, :view

  alias Techtree.Projects

  def author_name(%Projects.Project{ contributor: contributor }) do
    contributor.user.name
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
