import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './contact.entity';

@Injectable()
export class ContactService {
    constructor(
        @InjectRepository(Contact)
        private contactRepo: Repository<Contact>,
    ) {}

    async create(data: Partial<Contact>) {
        return this.contactRepo.save(this.contactRepo.create(data));
    }

    async findAll() {
        return this.contactRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findPending() {
        return this.contactRepo.find({
            where: { status: ContactStatus.PENDING },
            order: { createdAt: 'DESC' },
        });
    }

    async updateStatus(id: string, status: ContactStatus, adminNotes?: string) {
        const contact = await this.contactRepo.findOne({ where: { id } });
        if (!contact) throw new NotFoundException('Contact request not found');
        contact.status = status;
        if (adminNotes) contact.adminNotes = adminNotes;
        return this.contactRepo.save(contact);
    }

    async getStats() {
        const total = await this.contactRepo.count();
        const pending = await this.contactRepo.count({ where: { status: ContactStatus.PENDING } });
        return { total, pending };
    }
}
