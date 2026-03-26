import { Place } from '../places/place.entity';
export declare class Category {
    id: string;
    name: string;
    nameAr: string;
    nameFr: string;
    description: string;
    icon: string;
    image: string;
    color: string;
    sortOrder: number;
    places: Place[];
    createdAt: Date;
}
