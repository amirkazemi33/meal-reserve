import { getSession } from "@/lib/auth/session";
import { redirectUnlessPermission } from "@/lib/rbac/can";
import { PermissionCode } from "@/lib/auth/constants";
import { listOwnedUserLists } from "@/lib/meals";
import { UserListsManagement } from "@/components/admin/user-lists-management";

export default async function UserListsPage() {
  const session = await getSession();
  redirectUnlessPermission(session, PermissionCode.USER_LIST_MANAGE);

  const lists = await listOwnedUserLists(session!.userId);

  return <UserListsManagement lists={lists} />;
}
