import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { getOwnedUserList, listActiveUsersForPicker } from "@/lib/meals";
import { UserListDetail } from "@/components/admin/user-list-detail";

type Params = Promise<{ id: string }>;

export default async function UserListDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.USER_LIST_MANAGE);

  const { id } = await params;
  const [list, pickerUsers] = await Promise.all([
    getOwnedUserList(session!.userId, id),
    listActiveUsersForPicker(),
  ]);

  if (!list) {
    notFound();
  }

  return <UserListDetail list={list} pickerUsers={pickerUsers} />;
}
