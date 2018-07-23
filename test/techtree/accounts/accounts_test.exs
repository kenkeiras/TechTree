defmodule Techtree.AccountsTest do
  use Techtree.DataCase

  alias Techtree.Accounts

  describe "users" do
    alias Techtree.Accounts.User

    @valid_attrs %{name: "some name", username: "some username"}
    @update_attrs %{name: "some updated name", username: "some updated username"}
    @invalid_attrs %{name: nil, username: nil}

    def user_fixture(attrs \\ %{}) do
      {:ok, user} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_user()

      user
    end

    test "list_users/0 returns all users" do
      user = user_fixture()
      assert Accounts.list_users() == [user]
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Accounts.get_user!(user.id) == user
    end

    test "create_user/1 with valid data creates a user" do
      assert {:ok, %User{} = user} = Accounts.create_user(@valid_attrs)
      assert user.name == "some name"
      assert user.username == "some username"
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(@invalid_attrs)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      assert {:ok, user} = Accounts.update_user(user, @update_attrs)
      assert %User{} = user
      assert user.name == "some updated name"
      assert user.username == "some updated username"
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_user(user, @invalid_attrs)
      assert user == Accounts.get_user!(user.id)
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Accounts.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Accounts.change_user(user)
    end
  end

  describe "passwords" do
    alias Techtree.Accounts.Password

    @valid_attrs %{password: "some password"}
    @update_attrs %{password: "some updated password"}
    @invalid_attrs %{password: nil}

    def password_fixture(attrs \\ %{}) do
      {:ok, password} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_password()

      password
    end

    test "list_passwords/0 returns all passwords" do
      password = password_fixture()
      assert Accounts.list_passwords() == [password]
    end

    test "get_password!/1 returns the password with given id" do
      password = password_fixture()
      assert Accounts.get_password!(password.id) == password
    end

    test "create_password/1 with valid data creates a password" do
      assert {:ok, %Password{} = password} = Accounts.create_password(@valid_attrs)
      assert password.password == "some password"
    end

    test "create_password/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_password(@invalid_attrs)
    end

    test "update_password/2 with valid data updates the password" do
      password = password_fixture()
      assert {:ok, password} = Accounts.update_password(password, @update_attrs)
      assert %Password{} = password
      assert password.password == "some updated password"
    end

    test "update_password/2 with invalid data returns error changeset" do
      password = password_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_password(password, @invalid_attrs)
      assert password == Accounts.get_password!(password.id)
    end

    test "delete_password/1 deletes the password" do
      password = password_fixture()
      assert {:ok, %Password{}} = Accounts.delete_password(password)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_password!(password.id) end
    end

    test "change_password/1 returns a password changeset" do
      password = password_fixture()
      assert %Ecto.Changeset{} = Accounts.change_password(password)
    end
  end

  describe "emails" do
    alias Techtree.Accounts.Email

    @valid_attrs %{email: "some email"}
    @update_attrs %{email: "some updated email"}
    @invalid_attrs %{email: nil}

    def email_fixture(attrs \\ %{}) do
      {:ok, email} =
        attrs
        |> Enum.into(@valid_attrs)
        |> Accounts.create_email()

      email
    end

    test "list_emails/0 returns all emails" do
      email = email_fixture()
      assert Accounts.list_emails() == [email]
    end

    test "get_email!/1 returns the email with given id" do
      email = email_fixture()
      assert Accounts.get_email!(email.id) == email
    end

    test "create_email/1 with valid data creates a email" do
      assert {:ok, %Email{} = email} = Accounts.create_email(@valid_attrs)
      assert email.email == "some email"
    end

    test "create_email/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_email(@invalid_attrs)
    end

    test "update_email/2 with valid data updates the email" do
      email = email_fixture()
      assert {:ok, email} = Accounts.update_email(email, @update_attrs)
      assert %Email{} = email
      assert email.email == "some updated email"
    end

    test "update_email/2 with invalid data returns error changeset" do
      email = email_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_email(email, @invalid_attrs)
      assert email == Accounts.get_email!(email.id)
    end

    test "delete_email/1 deletes the email" do
      email = email_fixture()
      assert {:ok, %Email{}} = Accounts.delete_email(email)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_email!(email.id) end
    end

    test "change_email/1 returns a email changeset" do
      email = email_fixture()
      assert %Ecto.Changeset{} = Accounts.change_email(email)
    end
  end
end
