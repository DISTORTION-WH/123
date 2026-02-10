import User, { IUser } from '../models/User';

export class UserRepository {
 
  async findById(id: string) {
    return await User.findById(id);
  }

  
  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async findByEmailOrUsername(email: string, username: string) {
    return await User.findOne({
      $or: [{ email }, { username }],
    });
  }

  
  async create(userData: Partial<IUser>) {
    const user = new User(userData);
    return await user.save();
  }


  async save(user: any) { 
    return await user.save();
  }
}