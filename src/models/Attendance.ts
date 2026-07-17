import { countDocuments, insertMany, bulkWrite, aggregate, findQuery, SingleJQ } from '@/lib/jsonDb';

const COLLECTION = 'attendance';

export interface IAttendance {
  _id: string;
  student: string;
  class: string;
  session: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  method?: 'manual' | 'qr' | 'face';
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Attendance: any = {
  find(filter: Record<string, unknown> = {}) {
    return findQuery(COLLECTION, filter);
  },

  findById(id: string) {
    return new SingleJQ(COLLECTION, id);
  },

  countDocuments(filter: Record<string, unknown> = {}) {
    return Promise.resolve(countDocuments(COLLECTION, filter));
  },

  insertMany(docs: unknown[]) {
    return Promise.resolve(insertMany(COLLECTION, docs));
  },

  bulkWrite(operations: unknown[]) {
    bulkWrite(COLLECTION, operations);
    return Promise.resolve();
  },

  aggregate(pipeline: unknown[]) {
    return Promise.resolve(aggregate(COLLECTION, pipeline));
  },
};

export default Attendance;
