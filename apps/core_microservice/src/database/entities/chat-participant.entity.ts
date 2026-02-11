import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Chat } from './chat.entity';
import { Profile } from './profile.entity';

export enum ChatRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('chats_participants')
@Unique(['chatId', 'profileId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({
    type: 'enum',
    enum: ChatRole,
    default: ChatRole.MEMBER,
  })
  role: ChatRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => Profile, (profile) => profile.chatParticipants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
