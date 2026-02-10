import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity';
import { Post } from '../database/entities/post.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    const post = await this.postsRepository.findOne({
      where: { id: dto.postId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const profile = await this.profilesService.getProfileByUserId(userId);

    const comment = this.commentsRepository.create({
      content: dto.content,
      post: post,
      profile: profile,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.commentsRepository.save(comment);
  }

  async findByPostId(postId: string) {
    return await this.commentsRepository.find({
      where: { post: { id: postId } },
      relations: ['profile', 'profile.user'],
      order: { createdAt: 'ASC' },
    });
  }
}
