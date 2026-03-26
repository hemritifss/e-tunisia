import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip } from './tip.entity';

@Injectable()
export class TipsService {
    constructor(
        @InjectRepository(Tip)
        private tipsRepo: Repository<Tip>,
    ) {}

    async findAll(category?: string) {
        const where: any = { isActive: true, isApproved: true };
        if (category) where.category = category;
        return this.tipsRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['author'] });
    }

    async findById(id: string) {
        const tip = await this.tipsRepo.findOne({ where: { id }, relations: ['author'] });
        if (!tip) throw new NotFoundException('Tip not found');
        return tip;
    }

    async create(authorId: string, data: Partial<Tip>) {
        const tip = this.tipsRepo.create({ ...data, authorId });
        return this.tipsRepo.save(tip);
    }

    async like(id: string) {
        const tip = await this.findById(id);
        tip.likes += 1;
        return this.tipsRepo.save(tip);
    }

    async findAllAdmin() {
        return this.tipsRepo.find({ order: { createdAt: 'DESC' }, relations: ['author'] });
    }

    async toggleApproval(id: string) {
        const tip = await this.findById(id);
        tip.isApproved = !tip.isApproved;
        return this.tipsRepo.save(tip);
    }
}
