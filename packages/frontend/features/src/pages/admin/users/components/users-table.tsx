import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/frontend/ui";
import { ROLE_LABELS, type User } from "../../../../types/api/users";

export function UsersTable({ users }: { users: User[] }) {
  if (users.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-10 text-center text-sm">
        No users match these filters.
      </div>
    );
  }

  return (
    // The table, not the page, owns the horizontal overflow — the shell clips
    // page-level overflow-x, so a wide table would otherwise be unreachable.
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    {user.avatar && <AvatarImage src={user.avatar.url} alt="" />}
                    <AvatarFallback className="text-xs">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{user.name}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.group?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={user.confirmed ? "default" : "outline"}>
                  {user.confirmed ? "Confirmed" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDate(user.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Fixed locale and UTC, not the server's defaults: otherwise the string the
 * server renders and the one the browser would render differ, and React
 * reports a hydration mismatch.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
