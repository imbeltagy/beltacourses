import { GroupDetailsContent } from "./components/group-details-content";

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <GroupDetailsContent id={id} />;
}
