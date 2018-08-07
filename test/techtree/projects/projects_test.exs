defmodule Techtree.ProjectsTest do
  use Techtree.DataCase

  alias Techtree.Projects

  describe "projects" do
    alias Techtree.Projects.Project

    @valid_attrs %{name: "some name"}
    @update_attrs %{name: "some updated name"}
    @invalid_attrs %{name: nil}

    def project_fixture(attrs \\ %{}) do
      {:ok, project} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Projects.create_project()

      project
    end

    test "list_projects/0 returns all projects" do
      project = project_fixture()
      assert Projects.list_projects() == [project]
    end

    test "get_project!/1 returns the project with given id" do
      project = project_fixture()
      assert Projects.get_project!(project.id) == project
    end

    test "create_project/1 with valid data creates a project" do
      assert {:ok, %Project{} = project} = Projects.create_project(@valid_attrs)
      assert project.name == "some name"
    end

    test "create_project/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project(@invalid_attrs)
    end

    test "update_project/2 with valid data updates the project" do
      project = project_fixture()
      assert {:ok, project} = Projects.update_project(project, @update_attrs)
      assert %Project{} = project
      assert project.name == "some updated name"
    end

    test "update_project/2 with invalid data returns error changeset" do
      project = project_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_project(project, @invalid_attrs)
      assert project == Projects.get_project!(project.id)
    end

    test "delete_project/1 deletes the project" do
      project = project_fixture()
      assert {:ok, %Project{}} = Projects.delete_project(project)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_project!(project.id) end
    end

    test "change_project/1 returns a project changeset" do
      project = project_fixture()
      assert %Ecto.Changeset{} = Projects.change_project(project)
    end
  end

  describe "contributors" do
    alias Techtree.Projects.Contributor

    @valid_attrs %{role: "some role"}
    @update_attrs %{role: "some updated role"}
    @invalid_attrs %{role: nil}

    def contributor_fixture(attrs \\ %{}) do
      {:ok, contributor} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Projects.create_contributor()

      contributor
    end

    test "list_contributors/0 returns all contributors" do
      contributor = contributor_fixture()
      assert Projects.list_contributors() == [contributor]
    end

    test "get_contributor!/1 returns the contributor with given id" do
      contributor = contributor_fixture()
      assert Projects.get_contributor!(contributor.id) == contributor
    end

    test "create_contributor/1 with valid data creates a contributor" do
      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(@valid_attrs)
      assert contributor.role == "some role"
    end

    test "create_contributor/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_contributor(@invalid_attrs)
    end

    test "update_contributor/2 with valid data updates the contributor" do
      contributor = contributor_fixture()
      assert {:ok, contributor} = Projects.update_contributor(contributor, @update_attrs)
      assert %Contributor{} = contributor
      assert contributor.role == "some updated role"
    end

    test "update_contributor/2 with invalid data returns error changeset" do
      contributor = contributor_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_contributor(contributor, @invalid_attrs)
      assert contributor == Projects.get_contributor!(contributor.id)
    end

    test "delete_contributor/1 deletes the contributor" do
      contributor = contributor_fixture()
      assert {:ok, %Contributor{}} = Projects.delete_contributor(contributor)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_contributor!(contributor.id) end
    end

    test "change_contributor/1 returns a contributor changeset" do
      contributor = contributor_fixture()
      assert %Ecto.Changeset{} = Projects.change_contributor(contributor)
    end
  end

  describe "steps" do
    alias Techtree.Projects.Step

    @valid_attrs %{description: "some description", title: "some title"}
    @update_attrs %{description: "some updated description", title: "some updated title"}
    @invalid_attrs %{description: nil, title: nil}

    def step_fixture(attrs \\ %{}) do
      {:ok, step} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Projects.create_step()

      step
    end

    test "list_steps/0 returns all steps" do
      step = step_fixture()
      assert Projects.list_steps() == [step]
    end

    test "get_step!/1 returns the step with given id" do
      step = step_fixture()
      assert Projects.get_step!(step.id) == step
    end

    test "create_step/1 with valid data creates a step" do
      assert {:ok, %Step{} = step} = Projects.create_step(@valid_attrs)
      assert step.description == "some description"
      assert step.title == "some title"
    end

    test "create_step/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_step(@invalid_attrs)
    end

    test "update_step/2 with valid data updates the step" do
      step = step_fixture()
      assert {:ok, step} = Projects.update_step(step, @update_attrs)
      assert %Step{} = step
      assert step.description == "some updated description"
      assert step.title == "some updated title"
    end

    test "update_step/2 with invalid data returns error changeset" do
      step = step_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_step(step, @invalid_attrs)
      assert step == Projects.get_step!(step.id)
    end

    test "delete_step/1 deletes the step" do
      step = step_fixture()
      assert {:ok, %Step{}} = Projects.delete_step(step)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_step!(step.id) end
    end

    test "change_step/1 returns a step changeset" do
      step = step_fixture()
      assert %Ecto.Changeset{} = Projects.change_step(step)
    end
  end

  describe "dependencies" do
    alias Techtree.Projects.Dependency

    @valid_attrs %{}
    @update_attrs %{}
    @invalid_attrs %{}

    def dependency_fixture(attrs \\ %{}) do
      {:ok, dependency} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Projects.create_dependency()

      dependency
    end

    test "list_dependencies/0 returns all dependencies" do
      dependency = dependency_fixture()
      assert Projects.list_dependencies() == [dependency]
    end

    test "get_dependency!/1 returns the dependency with given id" do
      dependency = dependency_fixture()
      assert Projects.get_dependency!(dependency.id) == dependency
    end

    test "create_dependency/1 with valid data creates a dependency" do
      assert {:ok, %Dependency{} = dependency} = Projects.create_dependency(@valid_attrs)
    end

    test "create_dependency/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_dependency(@invalid_attrs)
    end

    test "update_dependency/2 with valid data updates the dependency" do
      dependency = dependency_fixture()
      assert {:ok, dependency} = Projects.update_dependency(dependency, @update_attrs)
      assert %Dependency{} = dependency
    end

    test "update_dependency/2 with invalid data returns error changeset" do
      dependency = dependency_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_dependency(dependency, @invalid_attrs)
      assert dependency == Projects.get_dependency!(dependency.id)
    end

    test "delete_dependency/1 deletes the dependency" do
      dependency = dependency_fixture()
      assert {:ok, %Dependency{}} = Projects.delete_dependency(dependency)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_dependency!(dependency.id) end
    end

    test "change_dependency/1 returns a dependency changeset" do
      dependency = dependency_fixture()
      assert %Ecto.Changeset{} = Projects.change_dependency(dependency)
    end
  end
end
