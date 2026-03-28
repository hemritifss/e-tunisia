import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './contact.entity';
export declare class ContactService {
    private contactRepo;
    constructor(contactRepo: Repository<Contact>);
    create(data: Partial<Contact>): Promise<Contact>;
    findAll(): Promise<Contact[]>;
    findPending(): Promise<Contact[]>;
    updateStatus(id: string, status: ContactStatus, adminNotes?: string): Promise<Contact>;
    getStats(): Promise<{
        total: number;
        pending: number;
    }>;
}
