defmodule TechtreeWeb.Projects.ProjectView do
  use TechtreeWeb, :view

  alias Techtree.Projects
  
  def author_name(%Projects.Project{ contributor: contributor }) do
    contributor.user.name
  end
end
