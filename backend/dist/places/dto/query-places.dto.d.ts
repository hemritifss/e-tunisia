export declare class QueryPlacesDto {
    search?: string;
    categoryId?: string;
    city?: string;
    governorate?: string;
    minRating?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
    featured?: string;
}
