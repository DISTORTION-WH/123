import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { Profile } from './profile.entity';
import { MessageAsset } from './message-asset.entity';
import { MessageReaction } from './message-reaction.entity';
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id' })
  chatId: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ type: 'text', nullable: true })
  content: string;

  // --- Новые поля ---
  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
  // ------------------

  @Column({ name: 'reply_to_message_id', nullable: true })
  replyToMessageId: string;

  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: 'reply_to_message_id' })
  replyTo: Message;

  @OneToMany(() => MessageAsset, (asset) => asset.message)
  assets: MessageAsset[];

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions: MessageReaction[];
}
