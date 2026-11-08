import { UserDetailsContent } from "./components/user-details-content";

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <UserDetailsContent id={id} />;
}
