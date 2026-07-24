import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory-item.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('place/:placeId')
  @ApiOperation({ summary: 'Get inventory items for a place' })
  findByPlace(@Param('placeId') placeId: string) {
    return this.inventoryService.findByPlace(placeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item details' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check availability for dates' })
  checkAvailability(
    @Param('id') id: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('guests') guests: number,
  ) {
    return this.inventoryService.checkAvailability(id, checkIn, checkOut, guests);
  }

  /*
   * These were "host only" by comment but enforced nothing: with just
   * JwtAuthGuard any logged-in user could create/edit/delete inventory for any
   * place (the service takes an id only, no owner check). There is currently no
   * host-ownership model to check against — Place has `submittedBy` but no
   * owner/host column — and no frontend calls these endpoints, so they are
   * admin-gated for now. When a real host-ownership model lands, swap AdminGuard
   * for a place-owner check and let hosts manage their own inventory.
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create inventory item (admin)' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update inventory item (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Delete inventory item (admin)' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
