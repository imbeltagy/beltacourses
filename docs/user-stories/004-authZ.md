## Access Level

### Super Admins

Have access to anything including: **_Create User_**

### Clients (Students, Teachers, Academy Moderators)

Have access to limited resources and actions statically defined by the API.

### Admins

If have the right permissions will have access to any resource/action

## Permissions

Permissions is statically defined in the API.

Each **Admin** is assigned to a **Group** that is holding set of **Permissions**.

An **Admin** with no group can handle nothing.

Only **Super Admins** can assign an **Admin** to a **Group** or remove them from it.

When a **Group's** set of **Permissions** get updated all linked **Admins'** sessions will be ended

When a **Group** is deleted all linked **Admins'** sessions will be ended

When an **Admin** changes the linked group, or is removed from it, their sessions will be ended

## Routes

Every route says who may use it. A route that says nothing is never open by accident: it fails
instead. A route anyone may call, such as signing in, must say so explicitly.
