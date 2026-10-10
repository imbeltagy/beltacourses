import { useFormatter, useTranslations } from "next-intl";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/frontend/ui";
import { DATE_FORMAT } from "../../../../configs/formats";
import type { Group } from "../../../../types/api/groups";

/** Beyond this, the row shows a "+N" chip instead of growing unboundedly. */
const PERMISSION_CHIP_LIMIT = 4;

export function GroupsTable({ groups }: { groups: Group[] }) {
  const t = useTranslations("admin.groups");
  const format = useFormatter();

  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border p-10 text-center text-sm">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.permissions")}</TableHead>
            <TableHead className="whitespace-nowrap">
              {t("columns.members")}
            </TableHead>
            <TableHead>{t("columns.created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const shown = group.permissions.slice(0, PERMISSION_CHIP_LIMIT);
            const hidden = group.permissions.length - shown.length;

            return (
              <TableRow key={group.id}>
                <TableCell>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{group.name}</div>
                    {group.description && (
                      <div className="text-muted-foreground max-w-[32ch] truncate text-xs">
                        {group.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {shown.map((permission) => (
                      <Badge
                        key={permission}
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {permission}
                      </Badge>
                    ))}
                    {hidden > 0 && (
                      <Badge
                        variant="outline"
                        title={group.permissions
                          .slice(PERMISSION_CHIP_LIMIT)
                          .join(", ")}
                      >
                        +{hidden}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {group.users_count}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {format.dateTime(new Date(group.created_at), DATE_FORMAT)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
