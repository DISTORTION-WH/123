// apps/core_microservice/src/comments/comments.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Comment } from '../database/entities/comment.entity';
import { CommentLike } from '../database/entities/comment-like.entity';
import { Post } from '../database/entities/post.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NOTIFICATIONS_SERVICE } from '../constants/services';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>, // <-- Имя репозитория
    @InjectRepository(CommentLike)
    private readonly commentLikesRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>, // <-- Имя репозитория
    private readonly profilesService: ProfilesService,
    @Inject(NOTIFICATIONS_SERVICE)
    private readonly notificationsClient: ClientProxy,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    const profile = await this.profilesService.getProfileByUserId(userId);

    // 1. Проверяем пост
    const post = await this.postsRepository.findOne({
      // <-- Исправлено на postsRepository
      where: { id: dto.postId },
      relations: ['profile', 'profile.user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // 2. Проверяем родительский комментарий
    let parentComment: Comment | null = null;
    if (dto.parentId) {
      parentComment = await this.commentsRepository.findOne({
        // <-- Исправлено на commentsRepository
        where: { id: dto.parentId },
        relations: ['profile', 'profile.user'],
      });
      if (!parentComment)
        throw new NotFoundException('Parent comment not found');

      if (parentComment.postId !== dto.postId) {
        throw new ForbiddenException('Parent comment belongs to another post');
      }
    }

    // 3. Создаем
    const comment = this.commentsRepository.create({
      // <-- Исправлено на commentsRepository
      content: dto.content,
      postId: dto.postId,
      profileId: profile.id,
      parentId: dto.parentId || null,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedComment = await this.commentsRepository.save(comment); // <-- Исправлено на commentsRepository

    // 4. Отправляем уведомления
    // А) Уведомление автору поста
    if (post.createdBy !== userId) {
      this.notificationsClient.emit('comment_created', {
        actorId: userId,
        targetUserId: post.profile.userId,
        targetUserEmail: post.profile.user.email,
        postId: post.id,
        commentId: savedComment.id,
        type: 'COMMENT_ON_POST',
        timestamp: new Date().toISOString(),
      });
    }

    // Б) Уведомление автору родительского комментария
    if (parentComment && parentComment.createdBy !== userId) {
      if (parentComment.createdBy !== post.createdBy) {
        this.notificationsClient.emit('comment_created', {
          actorId: userId,
          targetUserId: parentComment.profile.userId,
          targetUserEmail: parentComment.profile.user.email,
          postId: post.id,
          commentId: savedComment.id,
          type: 'REPLY_TO_COMMENT',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return this.getOne(savedComment.id); // <-- Исправлено с this.findOne на this.getOne
  }

  async getCommentsByPost(
    postId: string,
    currentUserId?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [comments, total] = await this.commentsRepository.findAndCount({
      where: { postId },
      relations: ['profile', 'parent', 'parent.profile'],
      order: { createdAt: 'ASC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const enrichedComments = await Promise.all(
      comments.map((c) => this.enrichComment(c, currentUserId)),
    );

    return {
      data: enrichedComments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // --- Public Get One ---
  async getOne(id: string, currentUserId?: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.enrichComment(comment, currentUserId);
  }

  async delete(id: string, userId: string) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    const userProfile = await this.profilesService.getProfileByUserId(userId);

    if (comment.profileId !== userProfile.id) {
      const post = await this.postsRepository.findOne({
        // <-- Исправлено
        where: { id: comment.postId },
      });
      if (post && post.profileId !== userProfile.id) {
        throw new ForbiddenException('You can only delete your own comments');
      }
    }

    await this.commentsRepository.remove(comment);
    return { message: 'Comment deleted' };
  }

  async toggleLike(userId: string, commentId: string) {
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const profile = await this.profilesService.getProfileByUserId(userId);

    const existingLike = await this.commentLikesRepository.findOne({
      where: { commentId, profileId: profile.id },
    });

    if (existingLike) {
      await this.commentLikesRepository.remove(existingLike);
      return { message: 'Unliked', liked: false };
    } else {
      const newLike = this.commentLikesRepository.create({
        commentId,
        profileId: profile.id,
        createdBy: userId,
      });
      await this.commentLikesRepository.save(newLike);
      return { message: 'Liked', liked: true };
    }
  }

  private async enrichComment(comment: Comment, userId?: string) {
    const likesCount = await this.commentLikesRepository.count({
      where: { commentId: comment.id },
    });

    let isLiked = false;
    if (userId) {
      const profile = await this.profilesService.getProfileByUserId(userId);
      const like = await this.commentLikesRepository.findOne({
        where: { commentId: comment.id, profileId: profile.id },
      });
      isLiked = !!like;
    }

    return {
      ...comment,
      likesCount,
      isLiked,
    };
  }
}
