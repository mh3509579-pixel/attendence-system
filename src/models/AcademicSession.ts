import { findOne, create, findByIdAndUpdate as updateById, findByIdAndDelete, updateMany, findQuery, SingleJQ } from '@/lib/jsonDb';

const COLLECTION = 'sessions';

export interface IAcademicSession {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AcademicSession: any = {
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
    return create(COLLECTION, data);
  },

  findByIdAndUpdate(id: string, update: Record<string, unknown>) {
    updateById(COLLECTION, id, update);
    return new SingleJQ(COLLECTION, id);
  },

  findByIdAndDelete(id: string) {
    return Promise.resolve(findByIdAndDelete(COLLECTION, id));
  },

  updateMany(filter: Record<string, unknown>, update: Record<string, unknown>) {
    return Promise.resolve(updateMany(COLLECTION, filter, update));
  },
};

export default AcademicSession;
