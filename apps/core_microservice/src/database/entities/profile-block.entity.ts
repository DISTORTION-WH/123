import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity('profile_blocks')
@Unique(['blockerId', 'blockedId'])
@Check('"blocker_id" != "blocked_id"')
export class ProfileBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blocker_id', type: 'uuid' })
  blockerId: string;

  @Column({ name: 'blocked_id', type: 'uuid' })
  blockedId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: Profile;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: Profile;
}
