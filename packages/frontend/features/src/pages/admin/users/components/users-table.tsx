import { useFormatter, useTranslations } from "next-intl";
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
import { Link } from "@repo/frontend/i18n/navigation";
import { DATE_FORMAT } from "../../../../configs/formats";
import type { User } from "../../../../types/api/users";

export function UsersTable({ users }: { users: User[] }) {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("roles");
  const format = useFormatter();

  if (users.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-10 text-center text-sm">
        {t("empty")}
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
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.role")}</TableHead>
            <TableHead>{t("columns.group")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.joined")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    {user.avatar && (
                      <AvatarImage src={user.avatar.url} alt="" />
                    )}
                    <AvatarFallback className="text-xs">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={`/users/${user.id}`}
                      className="hover:text-primary block truncate font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                    <div className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{tRoles(user.role)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.group?.name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={user.confirmed ? "default" : "outline"}>
                  {user.confirmed ? t("confirmed") : t("pending")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {format.dateTime(new Date(user.created_at), DATE_FORMAT)}
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
