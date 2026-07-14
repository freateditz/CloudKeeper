import { UserRepository } from "@cloudkeeper/database";

const userRepository = new UserRepository();

export const ProfileService = {
  async get(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err: any = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  async update(userId: string, data: any) {
    return userRepository.update(userId, data);
  },
};
