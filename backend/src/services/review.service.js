import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listMyReviews(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    prisma.productReview.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true,
            images: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.productReview.count({ where: { userId } }),
  ]);

  const reviews = rows.map(r => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    images: (() => { try { return r.images ? JSON.parse(r.images) : []; } catch { return []; } })(),
    isPublished: r.isPublished,
    createdAt: r.createdAt,
    product: {
      id: r.product.id,
      name: r.product.name,
      slug: r.product.slug,
      imageUrl: r.product.images[0]?.imageUrl ?? null,
    },
  }));

  return { reviews, total, page, limit };
}

export async function deleteMyReview(userId, reviewId) {
  const review = await prisma.productReview.findFirst({
    where: { id: reviewId, userId },
    select: { id: true, images: true },
  });
  if (!review) return false;

  // Parse stored image keys for cleanup (images field stores URLs, not keys — skip media cleanup here)
  await prisma.productReview.delete({ where: { id: reviewId } });
  return true;
}
