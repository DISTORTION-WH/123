import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { Profile } from './profile.entity';
import { MessageAsset } from './message-asset.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id', type: 'uuid' })
  chatId: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ type: 'text', nullable: true }) // Может быть пустым, если есть только вложения
  content: string;

  @Column({ name: 'reply_to_message_id', type: 'uuid', nullable: true })
  replyToMessageId: string;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ default: false })
  deleted: boolean;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => Profile, (profile) => profile.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_message_id' })
  replyTo: Message;

  @OneToMany(() => MessageAsset, (asset) => asset.message)
  assets: MessageAsset[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
}
