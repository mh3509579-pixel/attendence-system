import { findOne, create, findByIdAndUpdate as updateById, findByIdAndDelete, countDocuments, findQuery, SingleJQ } from '@/lib/jsonDb';

const COLLECTION = 'users';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const User: any = {
  find(filter: Record<string, unknown> = {}) {
    return findQuery(COLLECTION, filter);
  },

  findOne(filter: Record<string, unknown> = {}) {
    const result = findOne(COLLECTION, filter);
    return Promise.resolve(result);
  },

  findById(id: string) {
    return new SingleJQ(COLLECTION, id);
  },

  async create(data: unknown) {
    if (Array.isArray(data)) {
      return data.map((d: unknown) => create(COLLECTION, d));
    }
    return create(COLLECTION, data);
  },

  findByIdAndUpdate(id: string, update: Record<string, unknown>) {
    updateById(COLLECTION, id, update);
    return new SingleJQ(COLLECTION, id);
  },

  findByIdAndDelete(id: string) {
    return Promise.resolve(findByIdAndDelete(COLLECTION, id));
  },

  countDocuments(filter: Record<string, unknown> = {}) {
    return Promise.resolve(countDocuments(COLLECTION, filter));
  },

  insertMany(docs: unknown[]) {
    return Promise.resolve(docs.map((d: unknown) => create(COLLECTION, d)));
  },
};

export default User;
