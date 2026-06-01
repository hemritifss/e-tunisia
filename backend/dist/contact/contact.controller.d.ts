import { ContactService } from './contact.service';
import { ContactStatus } from './contact.entity';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    create(body: Partial<any>): Promise<import("./contact.entity").Contact>;
    findAll(): Promise<import("./contact.entity").Contact[]>;
    findPending(): Promise<import("./contact.entity").Contact[]>;
    getStats(): Promise<{
        total: number;
        pending: number;
    }>;
    updateStatus(id: string, body: {
        status: ContactStatus;
        adminNotes?: string;
    }): Promise<import("./contact.entity").Contact>;
}
