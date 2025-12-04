import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListItemsDto } from './dto/list-items.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // GET /catalog/items?page=1&limit=20&isActive=true
  @Get('items')
  async listItems(@Query() query: ListItemsDto) {
    return this.catalogService.listItems(query);
  }

  // GET /catalog/items/:id
  @Get('items/:id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.getItemById(id);
  }

  // GET /catalog/items/by-slug/:slug
  @Get('items/by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.catalogService.getItemBySlug(slug);
  }
}