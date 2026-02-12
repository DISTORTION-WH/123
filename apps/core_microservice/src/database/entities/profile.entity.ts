import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProfileFollow } from './profile-follow.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { PostLike } from './post-like.entity';
import { CommentLike } from './comment-like.entity';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ default: false })
  deleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @OneToOne(() => User, (user: User) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => ProfileFollow, (follow: ProfileFollow) => follow.follower)
  following: ProfileFollow[];

  @OneToMany(() => ProfileFollow, (follow: ProfileFollow) => follow.following)
  followers: ProfileFollow[];

  @OneToMany(() => Post, (post: Post) => post.profile)
  posts: Post[];

  @OneToMany(() => Comment, (comment: Comment) => comment.profile)
  comments: Comment[];

  @OneToMany(() => PostLike, (like: PostLike) => like.profile)
  postLikes: PostLike[];

  @OneToMany(() => CommentLike, (like: CommentLike) => like.profile)
  commentLikes: CommentLike[];

  @OneToMany(() => ChatParticipant, (participant) => participant.profile)
  chatParticipants: ChatParticipant[];

  @OneToMany(() => Message, (message) => message.profile)
  messages: Message[];
}
