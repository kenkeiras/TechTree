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
