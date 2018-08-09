defmodule Techtree.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Techtree.Repo

  alias Techtree.Accounts
  alias Techtree.Projects.{Contributor, Project}

  @doc """
  Returns the list of projects.

  ## Examples

      iex> list_projects()
      [%Project{}, ...]

  """
  def list_projects do
    Project
    |> Repo.all()
    |> Repo.preload(contributor: [user: :email])
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
    |> Repo.preload(contributor: [user: :email])
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
    Project
    |> Repo.get!(id)
    |> Repo.preload(contributor: [user: :email], steps: [])
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
  def create_project(%Contributor{} = contributor, attrs \\ %{}) do
    %Project{}
    |> Project.changeset(attrs)
    |> Ecto.Changeset.put_change(:contributor_id, contributor.id)
    |> Repo.insert()
  end

  def ensure_contributor_exists(%Accounts.User{} = user) do
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
  def create_step(%Contributor{} = contributor, %Project{} = project, attrs \\ %{}) do
    %Step{}
    |> Step.changeset(attrs)
    |> Ecto.Changeset.put_change(:contributor_id, contributor.id)
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
    depended
    |> Repo.preload(:dependencies) # Load existing data
    |> Ecto.Changeset.change() # Build the changeset
    |> Ecto.Changeset.put_assoc(:dependencies, [depender | depended.dependencies]) # Set the association
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
  def delete_dependency(depender_id, depended_id) do
    IO.inspect("Readying")
    query = from d in "dependencies",
              where: d.depended_id == ^depended_id and d.depender_id == ^depender_id

    IO.inspect(query)
    results = Repo.delete_all(query)
    IO.inspect(results)
    # delete_dependency(%Dependency{ depended: depended_id, depender: dependency_id })
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


end
