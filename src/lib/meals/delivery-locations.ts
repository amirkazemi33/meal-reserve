import { prisma } from "@/lib/prisma";

export async function getDeliveryLocations(activeOnly = true) {
  return prisma.deliveryLocation.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { title: "asc" },
  });
}

export async function getDeliveryLocationsForAdmin() {
  return prisma.deliveryLocation.findMany({
    orderBy: { title: "asc" },
    include: {
      _count: { select: { users: true, reservations: true } },
    },
  });
}

export async function getDeliveryLocationById(id: string) {
  return prisma.deliveryLocation.findUnique({ where: { id } });
}

export async function upsertDeliveryLocation(input: {
  id?: string;
  title: string;
  address: string;
  description?: string | null;
  isActive: boolean;
}) {
  const data = {
    title: input.title,
    address: input.address,
    description: input.description || null,
    isActive: input.isActive,
  };

  if (input.id) {
    return prisma.deliveryLocation.update({
      where: { id: input.id },
      data,
    });
  }

  return prisma.deliveryLocation.create({ data });
}

export async function deleteDeliveryLocation(
  id: string,
): Promise<{ error: string } | void> {
  const location = await prisma.deliveryLocation.findUnique({
    where: { id },
    select: {
      id: true,
      _count: { select: { users: true, reservations: true } },
    },
  });

  if (!location) {
    return { error: "محل تحویل پیدا نشد" };
  }

  if (location._count.users > 0) {
    return {
      error: `این محل به ${location._count.users} کاربر اختصاص دارد و قابل حذف نیست.`,
    };
  }

  if (location._count.reservations > 0) {
    return { error: "این محل در رزروها استفاده شده و قابل حذف نیست." };
  }

  await prisma.deliveryLocation.delete({ where: { id } });
}
