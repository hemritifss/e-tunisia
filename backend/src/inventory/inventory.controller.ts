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
import { InventoryService } from './inventory.service';

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

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create inventory item (host only)' })
  create(@Body() dto: any) {
    return this.inventoryService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update inventory item' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete inventory item' })
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
