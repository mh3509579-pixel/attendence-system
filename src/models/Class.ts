import { create, findByIdAndUpdate as updateById, findByIdAndDelete, countDocuments, findQuery, SingleJQ } from '@/lib/jsonDb';

const COLLECTION = 'classes';

export interface IClass {
  _id: string;
  name: string;
  section: string;
  subject?: string;
  session: string;
  teacher: string;
  students: string[];
  room?: string;
  schedule?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Class: any = {
  find(filter: Record<string, unknown> = {}) {
    return findQuery(COLLECTION, filter);
  },

  findById(id: string) {
    return new SingleJQ(COLLECTION, id);
  },

  async create(data: unknown) {
    return create(COLLECTION, { ...(data as object), isActive: true });
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
};

export default Class;
