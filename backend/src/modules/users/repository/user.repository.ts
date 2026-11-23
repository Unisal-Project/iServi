import type {
  UserEntity,
  UserRole,
  CreateUserData,
  UpdateUserData,
} from "../entity/user.entity.js";

export interface UserRepository {
  create(data: CreateUserData): Promise<UserEntity>;

  findById(id: bigint): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  findAll(): Promise<UserEntity[]>;

  update(
    id: bigint,
    data: UpdateUserData,
    expectedRole?: UserRole,
  ): Promise<UserEntity>;
}
