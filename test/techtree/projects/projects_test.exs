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
end
