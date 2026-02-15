import User, { IUser } from '../models/User';
// Pattern Repository
export class UserRepository {
 
  async findById(id: string) {
    return await User.findById(id);
  }

  
  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async findByEmailOrUsername(email: string, username: string) {
    return await User.findOne({
      $or: [{ email }, { username }],// The $or operator will return the document if at least one field matches
    });
  }

  
  async create(userData: Partial<IUser>) {
    const user = new User(userData);
    return await user.save();
  }

  async save(user: IUser) {
    return await user.save();
  }
}