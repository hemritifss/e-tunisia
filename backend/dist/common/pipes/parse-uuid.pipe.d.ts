import { PipeTransform } from '@nestjs/common';
export declare class ParseUUIDPipe implements PipeTransform<string, string> {
    private readonly uuidRegex;
    transform(value: string): string;
}
