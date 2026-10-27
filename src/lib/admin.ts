import { prisma } from "./prisma";
import { requireUserId } from "./session";

export async function requireAdminUser() {
  const userId = await requireUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!user?.isAdmin) return null;
  return user;
}
