import User, { IUser } from '../models/User';

export class UserRepository {
  // Найти по ID
  async findById(id: string) {
    return await User.findById(id);
  }

  // Найти по email
  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  // Проверка существования (для регистрации)
  async findByEmailOrUsername(email: string, username: string) {
    return await User.findOne({
      $or: [{ email }, { username }],
    });
  }

  // Создание нового пользователя
  // Мы принимаем уже готовый объект данных
  async create(userData: Partial<IUser>) {
    const user = new User(userData);
    return await user.save();
  }

  // Сохранение изменений (например, после обновления пароля)
  // Мы передаем сюда документ, который изменили в сервисе
  async save(user: any) { // user здесь имеет тип Mongoose Document
    return await user.save();
  }
}