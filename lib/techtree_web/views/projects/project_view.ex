defmodule TechtreeWeb.Projects.ProjectView do
  use TechtreeWeb, :view

  alias Techtree.Projects
  
  def author_name(%Projects.Project{ contributor: contributor }) do
    contributor.user.name
  end

  def render("export-project.json", %{project: project}) do
    %{
      steps: render_many(project.steps,
                         TechtreeWeb.Projects.DependencyView,
                         "single_step.json"),
      name: project.name
    }
  end

  def render("scripts.html", _assigns) do
    ~s{<script>require("js/dependency_graph.js").DependencyGraphRenderer.run()</script>}
    |> raw
  end
end
