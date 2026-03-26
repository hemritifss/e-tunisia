export declare class MediaController {
    uploadFile(file: Express.Multer.File): {
        url: string;
        filename: string;
        size: number;
    };
    uploadFiles(files: Express.Multer.File[]): {
        url: string;
        filename: string;
        size: number;
    }[];
}
