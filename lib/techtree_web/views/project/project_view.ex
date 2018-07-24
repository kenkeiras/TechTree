defmodule TechtreeWeb.Projects.ProjectView do
  use TechtreeWeb, :view

  alias Techtree.Projects
  alias TechtreeWeb.Projects.Project

  def author_name(%Projects.Project{ contributor: contributor }) do
    contributor.user.name
  end
end
