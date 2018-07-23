defmodule Techtree.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Techtree.Repo

  alias Techtree.Accounts.{User, Email, Password}

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    User
    |> Repo.all()
    |> Repo.preload(:email)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id) do
    User 
    |> Repo.get!(id)
    |> Repo.preload(:email)
  end

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.changeset(attrs)
    |> Ecto.Changeset.cast_assoc(:email, with: &Email.changeset/2)
    |> Ecto.Changeset.cast_assoc(:password, with: &Password.changeset/2)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Ecto.Changeset.cast_assoc(:email, with: &Email.changeset/2)
    |> Ecto.Changeset.cast_assoc(:password, with: &Password.changeset/2)
    |> Repo.update()
  end

  @doc """
  Deletes a User.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{source: %User{}}

  """
  def change_user(%User{} = user) do
    User.changeset(user, %{})
  end

  @doc """
  Returns the list of passwords.

  ## Examples

      iex> list_passwords()
      [%Password{}, ...]

  """
  def list_passwords do
    Repo.all(Password)
  end

  @doc """
  Gets a single password.

  Raises `Ecto.NoResultsError` if the Password does not exist.

  ## Examples

      iex> get_password!(123)
      %Password{}

      iex> get_password!(456)
      ** (Ecto.NoResultsError)

  """
  def get_password!(id), do: Repo.get!(Password, id)

  @doc """
  Creates a password.

  ## Examples

      iex> create_password(%{field: value})
      {:ok, %Password{}}

      iex> create_password(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_password(attrs \\ %{}) do
    %Password{}
    |> Password.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a password.

  ## Examples

      iex> update_password(password, %{field: new_value})
      {:ok, %Password{}}

      iex> update_password(password, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_password(%Password{} = password, attrs) do
    password
    |> Password.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Password.

  ## Examples

      iex> delete_password(password)
      {:ok, %Password{}}

      iex> delete_password(password)
      {:error, %Ecto.Changeset{}}

  """
  def delete_password(%Password{} = password) do
    Repo.delete(password)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking password changes.

  ## Examples

      iex> change_password(password)
      %Ecto.Changeset{source: %Password{}}

  """
  def change_password(%Password{} = password) do
    Password.changeset(password, %{})
  end

  @doc """
  Returns the list of emails.

  ## Examples

      iex> list_emails()
      [%Email{}, ...]

  """
  def list_emails do
    Repo.all(Email)
  end

  @doc """
  Gets a single email.

  Raises `Ecto.NoResultsError` if the Email does not exist.

  ## Examples

      iex> get_email!(123)
      %Email{}

      iex> get_email!(456)
      ** (Ecto.NoResultsError)

  """
  def get_email!(id), do: Repo.get!(Email, id)

  @doc """
  Creates a email.

  ## Examples

      iex> create_email(%{field: value})
      {:ok, %Email{}}

      iex> create_email(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_email(attrs \\ %{}) do
    %Email{}
    |> Email.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a email.

  ## Examples

      iex> update_email(email, %{field: new_value})
      {:ok, %Email{}}

      iex> update_email(email, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_email(%Email{} = email, attrs) do
    email
    |> Email.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a Email.

  ## Examples

      iex> delete_email(email)
      {:ok, %Email{}}

      iex> delete_email(email)
      {:error, %Ecto.Changeset{}}

  """
  def delete_email(%Email{} = email) do
    Repo.delete(email)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking email changes.

  ## Examples

      iex> change_email(email)
      %Ecto.Changeset{source: %Email{}}

  """
  def change_email(%Email{} = email) do
    Email.changeset(email, %{})
  end

  def authenticate_by_password(username, password) do
    query =
        from u in User,
        inner_join: p in assoc(u, :password),
        where: u.username == ^username,
        select: {u, p}

    case Repo.one(query) do
        {%User{} = user, %Password{} = stored_password} -> 
            IO.inspect(user)
            
            # TODO refactor this to make it more idiomatic
            case Password.check(password, stored_password) do
              true ->
                {:ok, user}
              false ->
                {:error, :unauthorized}
            end
        nil -> {:error, :unauthorized}
    end
  end
end
