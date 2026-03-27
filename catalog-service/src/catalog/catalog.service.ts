import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogEventsPublisher } from './catalog-events.publisher';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsPublisher: CatalogEventsPublisher,
  ) {}

  private readonly productSelect = {
    id: true,
    name: true,
    description: true,
    price: true,
    stock: true,
    category: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async getProducts() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: this.productSelect,
    });
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: this.productSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getProductByIdForViewer(productId: string, userId?: string) {
    const product = await this.getProductById(productId);

    if (userId) {
      await this.prisma.recentlyViewed.create({
        data: {
          userId,
          productId,
        },
      });

      await this.eventsPublisher.publish('catalog.product.viewed', {
        eventType: 'ProductViewed',
        userId,
        productId,
      });
    }

    return product;
  }

  async getRecentlyViewed(userId: string) {
    return this.prisma.recentlyViewed.findMany({
      where: {
        userId,
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        userId: true,
        productId: true,
        viewedAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });
  }

  async getFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        createdAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });
  }

  async addFavorite(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Product already in favorites');
    }

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        createdAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });

    await this.eventsPublisher.publish('catalog.favorite.added', {
      eventType: 'FavoriteAdded',
      userId,
      productId,
      favoriteId: favorite.id,
    });

    return favorite;
  }

  async removeFavorite(userId: string, productId: string) {
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingFavorite) {
      return {
        success: true,
        removed: false,
        message: 'Favorite not found, nothing to remove',
      };
    }

    await this.prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    await this.eventsPublisher.publish('catalog.favorite.removed', {
      eventType: 'FavoriteRemoved',
      userId,
      productId,
    });

    return {
      success: true,
      removed: true,
      productId,
    };
  }

  async getCart(userId: string) {
    return this.prisma.cartItem.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });
  }

  async addCartItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;

      if (newQuantity > product.stock) {
        throw new BadRequestException('Requested quantity exceeds available stock');
      }

      const updated = await this.prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          quantity: newQuantity,
        },
        select: {
          id: true,
          userId: true,
          productId: true,
          quantity: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: this.productSelect,
          },
        },
      });

      await this.eventsPublisher.publish('catalog.cart.item_added', {
        eventType: 'CartItemQuantityIncreased',
        userId,
        productId,
        quantity: updated.quantity,
        cartItemId: updated.id,
      });

      return updated;
    }

    const created = await this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });

    await this.eventsPublisher.publish('catalog.cart.item_added', {
      eventType: 'CartItemAdded',
      userId,
      productId,
      quantity: created.quantity,
      cartItemId: created.id,
    });

    return created;
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (quantity > product.stock) {
      throw new BadRequestException('Requested quantity exceeds available stock');
    }

    const updated = await this.prisma.cartItem.update({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      data: {
        quantity,
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        quantity: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: this.productSelect,
        },
      },
    });

    await this.eventsPublisher.publish('catalog.cart.item.updated', {
      eventType: 'CartItemUpdated',
      userId,
      productId,
      quantity: updated.quantity,
      cartItemId: updated.id,
    });

    return updated;
  }

  async removeCartItem(userId: string, productId: string) {
    const existingCartItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingCartItem) {
      return {
        success: true,
        removed: false,
        message: 'Cart item not found, nothing to remove',
      };
    }

    await this.prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    await this.eventsPublisher.publish('catalog.cart.item.removed', {
      eventType: 'CartItemRemoved',
      userId,
      productId,
    });

    return {
      success: true,
      removed: true,
      productId,
    };
  }
}