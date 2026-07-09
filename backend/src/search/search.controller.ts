import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search across places, posts, and users' })
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.searchService.search(q || '', {
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reindex all content (admin)' })
  async reindex() {
    return this.searchService.reindexAll();
  }
}
