import { prisma } from "@/lib/prisma";

export async function listOwnedUserLists(ownerId: string) {
  const lists = await prisma.userList.findMany({
    where: { ownerId },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return lists.map((list) => ({
    id: list.id,
    title: list.title,
    description: list.description,
    memberCount: list._count.members,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }));
}

export async function listOwnedUserListsWithMembers(ownerId: string) {
  const lists = await prisma.userList.findMany({
    where: { ownerId },
    include: {
      members: {
        select: { userId: true },
      },
    },
    orderBy: { title: "asc" },
  });

  return lists.map((list) => ({
    id: list.id,
    title: list.title,
    memberUserIds: list.members.map((member) => member.userId),
  }));
}

export async function getOwnedUserList(ownerId: string, listId: string) {
  const list = await prisma.userList.findFirst({
    where: { id: listId, ownerId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ user: { lastName: "asc" } }, { user: { name: "asc" } }],
      },
    },
  });

  if (!list) return null;

  return {
    id: list.id,
    title: list.title,
    description: list.description,
    members: list.members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      lastName: member.user.lastName,
      phone: member.user.phone,
      isActive: member.user.isActive,
      addedAt: member.createdAt,
    })),
  };
}

export async function listActiveUsersForPicker() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      lastName: true,
      phone: true,
      deliveryLocationId: true,
    },
    orderBy: [{ lastName: "asc" }, { name: "asc" }],
  });
}

export async function upsertUserList(input: {
  ownerId: string;
  id?: string;
  title: string;
  description?: string | null;
}) {
  const data = {
    title: input.title,
    description: input.description || null,
  };

  if (input.id) {
    const existing = await prisma.userList.findFirst({
      where: { id: input.id, ownerId: input.ownerId },
      select: { id: true },
    });
    if (!existing) {
      throw new Error("لیست پیدا نشد");
    }
    return prisma.userList.update({
      where: { id: input.id },
      data,
    });
  }

  return prisma.userList.create({
    data: {
      ...data,
      ownerId: input.ownerId,
    },
  });
}

export async function deleteUserList(ownerId: string, listId: string) {
  const existing = await prisma.userList.findFirst({
    where: { id: listId, ownerId },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("لیست پیدا نشد");
  }
  await prisma.userList.delete({ where: { id: listId } });
}

export async function addUserListMember(input: {
  ownerId: string;
  listId: string;
  userId: string;
}) {
  const list = await prisma.userList.findFirst({
    where: { id: input.listId, ownerId: input.ownerId },
    select: { id: true },
  });
  if (!list) {
    throw new Error("لیست پیدا نشد");
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, isActive: true },
    select: { id: true },
  });
  if (!user) {
    throw new Error("کاربر معتبر نیست");
  }

  await prisma.userListMember.create({
    data: {
      listId: input.listId,
      userId: input.userId,
    },
  });
}

export async function removeUserListMember(input: {
  ownerId: string;
  listId: string;
  userId: string;
}) {
  const list = await prisma.userList.findFirst({
    where: { id: input.listId, ownerId: input.ownerId },
    select: { id: true },
  });
  if (!list) {
    throw new Error("لیست پیدا نشد");
  }

  await prisma.userListMember.delete({
    where: {
      listId_userId: {
        listId: input.listId,
        userId: input.userId,
      },
    },
  });
}

/** Sync active-user membership to `selectedUserIds`. Inactive members are left unchanged. */
export async function syncUserListMembers(input: {
  ownerId: string;
  listId: string;
  selectedUserIds: string[];
}) {
  const list = await prisma.userList.findFirst({
    where: { id: input.listId, ownerId: input.ownerId },
    select: { id: true },
  });
  if (!list) {
    throw new Error("لیست پیدا نشد");
  }

  const uniqueSelected = [...new Set(input.selectedUserIds)];
  const validSelected = new Set(
    (
      await prisma.user.findMany({
        where: { isActive: true, id: { in: uniqueSelected } },
        select: { id: true },
      })
    ).map((user) => user.id),
  );

  const currentActiveMemberIds = new Set(
    (
      await prisma.userListMember.findMany({
        where: { listId: input.listId, user: { isActive: true } },
        select: { userId: true },
      })
    ).map((member) => member.userId),
  );

  const toAdd = [...validSelected].filter(
    (userId) => !currentActiveMemberIds.has(userId),
  );
  const toRemove = [...currentActiveMemberIds].filter(
    (userId) => !validSelected.has(userId),
  );

  if (toAdd.length === 0 && toRemove.length === 0) return;

  await prisma.$transaction([
    ...toAdd.map((userId) =>
      prisma.userListMember.create({
        data: { listId: input.listId, userId },
      }),
    ),
    ...toRemove.map((userId) =>
      prisma.userListMember.delete({
        where: {
          listId_userId: { listId: input.listId, userId },
        },
      }),
    ),
  ]);
}
