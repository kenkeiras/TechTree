defmodule TechtreeWeb.Projects.ProjectContributorsView do
  use TechtreeWeb, :view

  alias Techtree.Projects.Contributor
  alias Techtree.Accounts.{Email, User}

  def render("result.json", %{contributors: contributors}) do
    filtered = for c <- contributors, do: filter_contributor(c)
    %{contributors: filtered}
  end

  def filter_contributor(%Contributor{
        user: %User{email: %Email{email: email}},
        id: contributor_id
      }) do
    %{email: email, id: contributor_id}
  end

  def render("operation_result.json", %{result: result}) do
    result
  end
end
