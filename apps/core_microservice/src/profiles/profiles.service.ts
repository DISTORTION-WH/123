import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../database/entities/profile.entity';
import { User } from '../database/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getMyProfile(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        const newProfile = this.profileRepository.create({
          user,
          firstName: user.username,
        });
        return await this.profileRepository.save(newProfile);
      }
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getProfileByUsername(username: string): Promise<Profile> {
    // Теперь это поле username валидно, так как мы добавили его в User Entity
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    const profile = await this.profileRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.getMyProfile(userId);

    if (dto.firstName) profile.firstName = dto.firstName;
    if (dto.lastName) profile.lastName = dto.lastName;
    if (dto.bio) profile.bio = dto.bio;
    if (dto.birthDate) profile.birthDate = new Date(dto.birthDate);

    return await this.profileRepository.save(profile);
  }
}
