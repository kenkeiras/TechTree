defmodule TechtreeWeb.Projects.DependencyView do
  use TechtreeWeb, :view

  alias Techtree.Projects.Dependency

  def render("dependency_graph.json", %{graph: dependency_graph}) do
    %{steps: render_many(dependency_graph,
                         TechtreeWeb.Projects.DependencyView,
                         "single_step.json")}
  end

  def render("single_step.json", %{dependency: dep}) do
    dependencies = for step <- dep.dependencies, do: step.id

    %{
       id: dep.id,
       title: dep.title,
       description: dep.description,
       dependencies: dependencies
    }
  end
end
