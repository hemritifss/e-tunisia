import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Place } from './place.entity';
import { User } from '../users/user.entity';
import { PlaceInquiry } from './place-inquiry.entity';
import { TourPackage } from './tour-package.entity';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
    imports: [TypeOrmModule.forFeature([Place, User, PlaceInquiry, TourPackage]), NotificationsModule, CreditsModule],
    providers: [PlacesService, InquiriesService, PackagesService],
    controllers: [PlacesController, InquiriesController, PackagesController],
    exports: [PlacesService, InquiriesService, PackagesService],
})
export class PlacesModule { }