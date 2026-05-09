import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CatalogService } from './catalog.service';
import {
  GatewayUserGuard,
  OptionalGatewayUserGuard,
} from '../common/guards/gateway-user.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

type RequestWithContext = Request & {
  requestId?: string;
  kongRequestId?: string;
};

function getAuditContext(req: RequestWithContext) {
  return {
    requestId: req.requestId,
    kongRequestId: req.kongRequestId,
  };
}

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'catalog-service',
    };
  }

  @Get('me')
  @UseGuards(GatewayUserGuard)
  getMe(@UserId() userId: string) {
    return {
      ok: true,
      userId,
    };
  }

  @Get('products')
  async getProducts() {
    return this.catalogService.getProducts();
  }

  @Get('products/:id')
  @UseGuards(OptionalGatewayUserGuard)
  async getProductById(
    @Param('id') id: string,
    @UserId() userId: string | undefined,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.getProductByIdForViewer(
      id,
      userId,
      getAuditContext(req),
    );
  }

  @Get('recently-viewed')
  @UseGuards(GatewayUserGuard)
  async getRecentlyViewed(@UserId() userId: string) {
    return this.catalogService.getRecentlyViewed(userId);
  }

  @Get('favorites')
  @UseGuards(GatewayUserGuard)
  async getFavorites(@UserId() userId: string) {
    return this.catalogService.getFavorites(userId);
  }

  @Post('favorites/:productId')
  @UseGuards(GatewayUserGuard)
  async addFavorite(
    @UserId() userId: string,
    @Param('productId') productId: string,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.addFavorite(
      userId,
      productId,
      getAuditContext(req),
    );
  }

  @Delete('favorites/:productId')
  @UseGuards(GatewayUserGuard)
  async removeFavorite(
    @UserId() userId: string,
    @Param('productId') productId: string,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.removeFavorite(
      userId,
      productId,
      getAuditContext(req),
    );
  }

  @Get('cart')
  @UseGuards(GatewayUserGuard)
  async getCart(@UserId() userId: string) {
    return this.catalogService.getCart(userId);
  }

  @Post('cart/items/:productId')
  @UseGuards(GatewayUserGuard)
  async addCartItem(
    @UserId() userId: string,
    @Param('productId') productId: string,
    @Body() body: AddCartItemDto,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.addCartItem(
      userId,
      productId,
      body.quantity,
      getAuditContext(req),
    );
  }

  @Patch('cart/items/:productId')
  @UseGuards(GatewayUserGuard)
  async updateCartItem(
    @UserId() userId: string,
    @Param('productId') productId: string,
    @Body() body: UpdateCartItemDto,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.updateCartItem(
      userId,
      productId,
      body.quantity,
      getAuditContext(req),
    );
  }

  @Delete('cart/items/:productId')
  @UseGuards(GatewayUserGuard)
  async removeCartItem(
    @UserId() userId: string,
    @Param('productId') productId: string,
    @Req() req: RequestWithContext,
  ) {
    return this.catalogService.removeCartItem(
      userId,
      productId,
      getAuditContext(req),
    );
  }
}