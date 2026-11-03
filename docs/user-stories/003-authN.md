## Staying signed in

|                                                 | Clients       | Moderators   |
| ----------------------------------------------- | ------------- | ------------ |
| Stay signed in without re-entering the password | 7 days        | 10 hours     |
| Credential refreshed in the background          | every 30 mins | every 5 mins |

Every sign-in is a **session**, for clients and moderators alike. Each time the credential is
refreshed, the previous refresh credential stops working.

### Clients

Signing out ends only that session. Staff can end a client's sessions remotely, but a credential
already issued keeps working until it expires, at most 30 minutes.

### Moderators

- Every sign-in is a **session** that staff can end remotely, effective on the very next request.
- Signing out ends only that session.
- When an admin's **permissions change**, all of that admin's sessions end and they must sign in
  again. That covers: their group changes or is removed, their group's permissions change, their
  group is deleted, their role changes, or their account is deleted.
