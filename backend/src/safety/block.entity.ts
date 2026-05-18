import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, Unique,
} from 'typeorm';

@Entity('user_blocks')
@Unique(['blockerId', 'blockedId'])
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    blockerId: string;

    @Column()
    @Index()
    blockedId: string;

    @CreateDateColumn()
    createdAt: Date;
}
