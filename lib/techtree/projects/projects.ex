defmodule Techtree.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Techtree.Repo

  alias Techtree.Accounts.{User, Email}
  alias Techtree.Projects.{Contributor, Project, Step}

  def is_project_completed(%Project{} = project) do
    (
      length(project.steps) > 0
      and
      Enum.all?(project.steps, fn x -> Step.finished?(x) end)
    )
  end

  def check_completed_project(%Project{} = project) do
    %{
      project |
      completed: is_project_completed(project)
    }
  end

  def check_completed_projects(projects) do
    for project <- projects, do: check_completed_project(project)
  end

  @doc """
  Returns the list of projects a contributor can have access to.
  At this point is the projects the contributor owns.

  ## Examples

      iex> list_projects()
      [%Project{}, ...]

  """
  def list_projects(contributor=%Contributor{}) do
    owned_projects = get_projects_owned(contributor)
    contributed_projects = get_projects_contributed(contributor)

    check_completed_projects(owned_projects ++ contributed_projects)
  end

  def get_projects_owned(contributor=%Contributor{}) do
    Project
    |> Ecto.Query.where(owner_id: ^contributor.id)
    |> Repo.all()
    |> Repo.preload(owner: [user: :email], steps: [])
  end

  def get_projects_contributed(contributor=%Contributor{}) do
    query = from pc in "project_contributors",
            where: pc.contributor_id == ^contributor.id,
            select: pc.project_id

    projects = Repo.all(query)

    for project_id <- projects, do:
      Project
      |> Repo.get!(project_id)
      |> Repo.preload(owner: [user: :email], steps: [])
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_project!(id) do
    Project
    |> Repo.get!(id)
    |> Repo.preload(owner: [user: :email])
  end

  @doc """
  Retrieve a project with all it's contributors.
  """
  def get_project_with_contributors(id) do
    Project
    |> Repo.get!(id)
    |> Repo.preload([:contributors])
  end

  @doc """
  Retrieve a project with all it's contributors.
  """
  def get_project_with_fullcontributors(id) do
    Project
    |> Repo.get!(id)
    |> Repo.preload([contributors: [user: :email]])
  end

  @doc """
  Retrieve a project with all it's contributors.
  """
  def get_project_contributor_set(id) do
    contributors =
      for(
        %Contributor{id: contributor_id} <- get_project_with_contributors(id).contributors,
        do: contributor_id
      )

    Enum.into(contributors, MapSet.new)
  end

  @doc """
  Adds a contributor to a project.
  """
  def add_project_contributor(project = %Project{}, contributor = %Contributor{}) do
    project
    |> Repo.preload(:contributors) # Load existing data
    |> Ecto.Changeset.change() # Build the changeset
    |> Ecto.Changeset.put_assoc(:contributors, [contributor | project.contributors]) # Set the association
    |> Repo.update!
  end


  @spec project_involves_contributor(Project.t(), Contributor.t()) :: boolean()
  def project_involves_contributor(
        %Project{owner_id: owner_id},
        %Contributor{id: owner_id}
      ) do
    true
  end

  def project_involves_contributor(
    %Project{contributors: contributors},
    %Contributor{id: contributor_id}
  ) do
    involved_ids = for c <- contributors, do: c.id

    MapSet.member?(Enum.into(contributors, MapSet.new), contributor_id)
  end

  @doc """
  Removes a contributor from a project.
  """
  def remove_project_contributor(project_id, removed_contributor_id) when is_number(project_id) and is_number(removed_contributor_id) do
    # This is built as a custom query to avoid having to resolve
    # the elements being deleted
    query = """
    DELETE
    FROM project_contributors
    WHERE project_id = $1
      AND contributor_id = $2
    ;
    """

    Ecto.Adapters.SQL.query(Repo, query, [project_id, removed_contributor_id])
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_project_with_steps!(id) do
    project = Project
    |> Repo.get!(id)
    |> Repo.preload(owner: [user: :email], steps: [])
    check_completed_project(project)
  end

  @doc """
  Gets a single project.

  Raises `Ecto.NoResultsError` if the Project does not exist.

  ## Examples

      iex> get_project!(123)
      %Project{}

      iex> get_project!(456)
      ** (Ecto.NoResultsError)

  """
  def get_full_project!(id) do
    Project
    |> Repo.get!(id)
    |> Repo.preload(steps: [:dependencies])
  end

  @doc """
  Creates a project.

  ## Examples

      iex> create_project(%{field: value})
      {:ok, %Project{}}

      iex> create_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_project(%Contributor{} = owner, attrs \\ %{}) do
    %Project{}
    |> Project.changeset(attrs)
    |> Ecto.Changeset.put_change(:owner_id, owner.id)
    |> Repo.insert()
  end

  def ensure_contributor_exists(%User{} = user) do
    %Contributor{user_id: user.id}
    |> Ecto.Changeset.change()
    |> Ecto.Changeset.unique_constraint(:user_id)
    |> Repo.insert()
    |> handle_existing_contributor()
  end

  defp handle_existing_contributor({:ok, contributor}), do: contributor
  defp handle_existing_contributor({:error, changeset}) do
    Repo.get_by!(Contributor, user_id: changeset.data.user_id)
  end

  @doc """
  Updates a project.

  ## Examples

      iex> update_project(project, %{field: new_value})
      {:ok, %Project{}}

      iex> update_project(project, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Project.

  ## Examples

      iex> delete_project(project)
      {:ok, %Project{}}

      iex> delete_project(project)
      {:error, %Ecto.Changeset{}}

  """
  def delete_project(%Project{} = project) do
    Repo.delete(project)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking project changes.

  ## Examples

      iex> change_project(project)
      %Ecto.Changeset{source: %Project{}}

  """
  def change_project(%Project{} = project) do
    Project.changeset(project, %{})
  end

  @doc """
  Returns the list of email.

  ## Examples

      iex> list_email()
      [%Contributor{}, ...]

  """
  def list_email do
    Repo.all(Contributor)
  end

  @doc """
  Gets a single contributor.

  Raises `Ecto.NoResultsError` if the Contributor does not exist.

  ## Examples

      iex> get_contributor!(123)
      %Contributor{}

      iex> get_contributor!(456)
      ** (Ecto.NoResultsError)

  """
  def get_contributor!(id) do
    Contributor
    |> Repo.get!(id)
    |> Repo.preload(user: :email)
  end

  @spec get_contributor_with_username(String.t()) :: Contributor.t()
  def get_contributor_with_username(username) do
    user =
      User
      |> Repo.get_by!(username: username)

    ensure_contributor_exists(user)
  end

  @doc """
  Creates a contributor.

  ## Examples

      iex> create_contributor(%{field: value})
      {:ok, %Contributor{}}

      iex> create_contributor(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_contributor(attrs \\ %{}) do
    %Contributor{}
    |> Contributor.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a contributor.

  ## Examples

      iex> update_contributor(contributor, %{field: new_value})
      {:ok, %Contributor{}}

      iex> update_contributor(contributor, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_contributor(%Contributor{} = contributor, attrs) do
    contributor
    |> Contributor.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Contributor.

  ## Examples

      iex> delete_contributor(contributor)
      {:ok, %Contributor{}}

      iex> delete_contributor(contributor)
      {:error, %Ecto.Changeset{}}

  """
  def delete_contributor(%Contributor{} = contributor) do
    Repo.delete(contributor)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking contributor changes.

  ## Examples

      iex> change_contributor(contributor)
      %Ecto.Changeset{source: %Contributor{}}

  """
  def change_contributor(%Contributor{} = contributor) do
    Contributor.changeset(contributor, %{})
  end

  alias Techtree.Projects.{Step, Dependency}

  @doc """
  Returns the list of steps.

  ## Examples

      iex> list_steps()
      [%Step{}, ...]

  """
  def list_steps do
    Repo.all(Step)
  end

  @doc """
  Returns the list of steps on a specific project.

  ## Examples

      iex> list_steps_in_project(%Project{ id=42 })
      [%Step{}, ...]

  """
  def list_steps_in_project(%Project{} = project) do
    Step
    |> Ecto.Query.where(project_id: ^project.id)
    |> Repo.all()
  end

  @doc """
  Gets a single step.

  Raises `Ecto.NoResultsError` if the Step does not exist.

  ## Examples

      iex> get_step!(123)
      %Step{}

      iex> get_step!(456)
      ** (Ecto.NoResultsError)

  """
  def get_step!(id), do: Repo.get!(Step, id)

  @doc """
  Gets a single step.

  Raises `Ecto.NoResultsError` if the Step does not exist.

  ## Examples

      iex> get_step!(123)
      %Step{}

      iex> get_step!(456)
      ** (Ecto.NoResultsError)

  """
  def get_step_with_project!(id) do
    Step
    |> Repo.get!(id)
    |> Repo.preload(project: [])
  end

  @doc """
  Gets a single step.

  Raises `Ecto.NoResultsError` if the Step does not exist.

  ## Examples

      iex> get_step!(123)
      %Step{}

      iex> get_step!(456)
      ** (Ecto.NoResultsError)

  """
  def get_step_with_dependencies!(id) do
    Step
    |> Repo.get!(id)
    |> Repo.preload([:project, :dependencies])
  end

  @doc """
  Creates a step.

  ## Examples

      iex> create_step(%{field: value})
      {:ok, %Step{}}

      iex> create_step(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_step(%Contributor{} = owner, %Project{} = project, attrs \\ %{}) do
    %Step{}
    |> Step.changeset(attrs)
    |> Ecto.Changeset.put_change(:project_id, project.id)
    |> Repo.insert()
  end

  @doc """
  Updates a step.

  ## Examples

      iex> update_step(step, %{field: new_value})
      {:ok, %Step{}}

      iex> update_step(step, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_step(%Step{} = step, attrs) do
    step
    |> Step.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Adds changes to a step.

  ## Examples

      iex> update_step(step, %{field: new_value})
      {:ok, %Step{}}

      iex> update_step(step, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def gen_step_patch(patch) do
    %{}
    |> patch_step_state(patch)
    |> patch_step_title(patch)
    |> patch_step_description(patch)
  end

  def patch_step_state(patch, %{ "state" => state }) do
    Map.put(patch, "state", state)
  end

  def patch_step_state(patch, _) do
    patch
  end

  def patch_step_title(patch, %{ "title" => title }) do
    Map.put(patch, "title", title)
  end

  def patch_step_title(patch, _) do
    patch
  end

  def patch_step_description(patch, %{ "description" => description }) do
    Map.put(patch, "description", description)
  end

  def patch_step_description(patch, _) do
    patch
  end

  @doc """
  Deletes a Step.

  ## Examples

      iex> delete_step(step)
      {:ok, %Step{}}

      iex> delete_step(step)
      {:error, %Ecto.Changeset{}}

  """
  def delete_step(%Step{} = step) do
    Repo.delete(step)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking step changes.

  ## Examples

      iex> change_step(step)
      %Ecto.Changeset{source: %Step{}}

  """
  def change_step(%Step{} = step) do
    Step.changeset(step, %{})
  end

  alias Techtree.Projects.Dependency

  @doc """
  Returns the list of dependencies.

  ## Examples

      iex> list_dependencies()
      [%Dependency{}, ...]

  """
  def list_dependencies do
    Repo.all(Dependency)
  end

  @doc """
  Gets a single dependency.

  Raises `Ecto.NoResultsError` if the Dependency does not exist.

  ## Examples

      iex> get_dependency!(123)
      %Dependency{}

      iex> get_dependency!(456)
      ** (Ecto.NoResultsError)

  """
  def get_dependency!(id), do: Repo.get!(Dependency, id)

  @doc """
  Creates a dependency.
  """
  def create_dependency(depended, depender) do
    depender
    |> Repo.preload(:dependencies) # Load existing data
    |> Ecto.Changeset.change() # Build the changeset
    |> Ecto.Changeset.put_assoc(:dependencies, [depended | depender.dependencies]) # Set the association
    |> Repo.update!
  end

  @doc """
  Updates a dependency.

  ## Examples

      iex> update_dependency(dependency, %{field: new_value})
      {:ok, %Dependency{}}

      iex> update_dependency(dependency, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_dependency(%Dependency{} = dependency, attrs) do
    dependency
    |> Dependency.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Dependency.

  ## Examples

      iex> delete_dependency(dependency)
      {:ok, %Dependency{}}

      iex> delete_dependency(dependency)
      {:error, %Ecto.Changeset{}}

  """
  def delete_dependency(%Dependency{} = dependency) do
    Repo.delete(dependency)
  end

  @doc """
  Deletes a Dependency.

  ## Examples

      iex> delete_dependency(dependency)
      {:ok, %Dependency{}}

      iex> delete_dependency(dependency)
      {:error, %Ecto.Changeset{}}

  """
  def delete_dependency(depender_id, depended_id) when is_number(depender_id) and is_number(depended_id) do
    # This is built as a custom query to avoid having to resolve
    # depender_id and depended_id
    query = """
    DELETE
    FROM dependencies
    WHERE depender_id = $1
      AND depended_id = $2
    ;
    """

    Ecto.Adapters.SQL.query(Repo, query, [depender_id, depended_id])
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking dependency changes.

  ## Examples

      iex> change_dependency(dependency)
      %Ecto.Changeset{source: %Dependency{}}

  """
  def change_dependency(%Dependency{} = dependency) do
    Dependency.changeset(dependency, %{})
  end

  @doc """
  Returns the list of steps on a specific project.

  ## Examples

      iex> list_steps_in_project(%Project{ id=42 })
      [%Step{}, ...]

  """
  def get_dependency_graph(%Project{} = project) do
    Step
    |> Ecto.Query.where(project_id: ^project.id)
    |> Repo.all()
    |> Repo.preload([:dependencies])
  end

  def import_project(conn, %{ "steps" => steps }, name) do
    {:ok, project} = create_project(conn.assigns.current_contributor, %{ "name" => name })

    mapzip = for step <- steps, do: import_step(conn, project, step)
    map = Enum.reduce(mapzip, %{}, fn {import_id, new_id}, acc ->
      Map.put(acc, import_id, new_id)
    end)

    for step <- steps, do: add_dependencies(conn, project, map, step)

    {:ok, project}
  end

  def add_dependencies(_conn, _project, map, %{ "id" => import_id, "dependencies" => dependencies }) do
    step = get_step_with_dependencies!(Map.get(map, import_id))
    Enum.each(dependencies, fn dep_import_id ->
      new_id = Map.get(map, dep_import_id)
      depended_step = get_step!(new_id)
      %Step{} = create_dependency(depended_step, step)
    end)
  end

  def import_step(conn, project, %{"title" => title,
    "id" => import_id,
    "description" => description,
    "dependencies" => _import_dependencies,
    "state" => state
  })do
    {:ok, new_step } = create_step(conn.assigns.current_contributor, project,
                                    %{
                                      "title" => title,
                                      "description" => description,
                                      "state" => state
                                    })
    { import_id, new_step.id }
  end

  def import_project_from_file(conn, name, path) do
    content = File.read!(path)
    decoded = Poison.decode!(content)
    import_project(conn, decoded, name)
  end
end
