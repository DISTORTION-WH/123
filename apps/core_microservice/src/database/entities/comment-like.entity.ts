import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Comment } from './comment.entity';
import { Profile } from './profile.entity';

@Entity('comment_likes')
@Unique(['commentId', 'profileId']) // Один юзер - один лайк на коммент
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comment_id' })
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ name: 'profile_id' })
  profileId: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
