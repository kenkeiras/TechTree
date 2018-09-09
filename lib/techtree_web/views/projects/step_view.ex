defmodule TechtreeWeb.Projects.StepView do
  use TechtreeWeb, :view

  alias Techtree.Projects

  def render("operation_result.json", %{result: result}) do
    result
  end

end
