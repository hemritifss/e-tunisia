import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Declares the ONLY fields a client may set when creating a collection.
 *
 * The controller previously took `@Body() body: any` and the service did
 * `repo.create({ ...data, ownerId })`, so everything except the owner was
 * client-controlled — a user could mint a collection with `isPremium: true`
 * and `likeCount: 99999`. The global ValidationPipe runs with
 * `whitelist: true` + `forbidNonWhitelisted: true`, so any field not declared
 * here is now rejected outright.
 */
export class CreateCollectionDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  placeIds?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
