import { prisma } from "@/lib/prisma";

export async function getDeliveryLocations(activeOnly = true) {
  return prisma.deliveryLocation.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { title: "asc" },
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
