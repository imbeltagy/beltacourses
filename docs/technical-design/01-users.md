# Users

- **Implements:** `001-users`
- **Status:** Implemented

One `users` table holds every account, whatever the role.

| Field                            | Notes                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `id`                             | UUID                                                                                 |
| `email`                          | unique                                                                               |
| `hashed_password`                |                                                                                      |
| `name`                           |                                                                                      |
| `role`                           | `student`, `teacher`, `academy_moderator`, `admin`, `super_admin`; default `student` |
| `confirmed`                      | email confirmed, default `false`                                                     |
| `bio`, `gender`, `date_of_birth` | **optional**                                                                         |
| `avatar_id`                      | optional, a file from the file service                                               |
| `group_id`                       | optional, only an `admin` ever has one                                               |
| `created_at`, `updated_at`       |                                                                                      |
| `deleted_at`                     | soft delete                                                                          |

`bio`, `gender` and `date_of_birth` exist on every user but are optional, so moderators (admins and
super admins) may leave them empty.
