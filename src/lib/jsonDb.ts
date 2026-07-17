/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function read<T>(name: string): T[] {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function write<T>(name: string, data: T[]): void {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

function matchesFilter<T extends Record<string, any>>(item: T, filter: Record<string, any>): boolean {
  for (const key of Object.keys(filter)) {
    const val = filter[key];
    if (key === '$or') {
      if (!val.some((cond: any) => matchesFilter(item, cond))) return false;
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const itemVal = (item as any)[key];
      if (val.$gte && itemVal < val.$gte) return false;
      if (val.$lte && itemVal > val.$lte) return false;
      if (val.$gt && itemVal <= val.$gt) return false;
      if (val.$lt && itemVal >= val.$lt) return false;
      if (val.$in) {
        const inArray = Array.isArray(itemVal) ? itemVal : [itemVal];
        if (!inArray.some((v: unknown) => val.$in.includes(v))) return false;
      }
      if (val.$regex && !String(itemVal).match(new RegExp(val.$regex, val.$options || ''))) return false;
      if (val.$ne && itemVal === val.$ne) return false;
      continue;
    }
    if ((item as any)[key] !== val) return false;
  }
  return true;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function find<T extends Record<string, any> = any>(
  name: string,
  filter: Record<string, any> = {},
): T[] {
  const items = read<T>(name);
  return items.filter(item => matchesFilter(item, filter));
}

export function findOne<T extends Record<string, any> = any>(
  name: string,
  filter: Record<string, any> = {},
): T | null {
  const items = read<T>(name);
  return items.find(item => matchesFilter(item, filter)) || null;
}

export function findById<T extends Record<string, any> = any>(
  name: string,
  id: string,
): T | null {
  return findOne<T>(name, { _id: id } as any);
}

export function create<T extends Record<string, any> = any>(
  name: string,
  data: any,
): T {
  const items = read<any>(name);
  const doc = {
    _id: generateId(),
    ...data,
    createdAt: data.createdAt || now(),
    updatedAt: data.updatedAt || now(),
  };
  items.push(doc);
  write(name, items);
  return doc as T;
}

function applyUpdate(item: Record<string, any>, update: Record<string, any>): void {
  for (const key of Object.keys(update)) {
    if (key === '$set') {
      for (const sk of Object.keys(update.$set)) {
        item[sk] = update.$set[sk];
      }
    } else if (key === '$push') {
      for (const pk of Object.keys(update.$push)) {
        if (!item[pk]) item[pk] = [];
        if (Array.isArray(item[pk])) {
          item[pk].push(update.$push[pk]);
        }
      }
    } else if (key === '$pull') {
      for (const pk of Object.keys(update.$pull)) {
        if (Array.isArray(item[pk])) {
          item[pk] = item[pk].filter((v: unknown) => v !== update.$pull[pk]);
        }
      }
    } else if (key === '$inc') {
      for (const ik of Object.keys(update.$inc)) {
        item[ik] = (item[ik] || 0) + update.$inc[ik];
      }
    } else {
      item[key] = update[key];
    }
  }
}

export function findByIdAndUpdate<T extends Record<string, any> = any>(
  name: string,
  id: string,
  update: Record<string, any>,
  opts: { new?: boolean } = {},
): T | null {
  const items = read<any>(name);
  const idx = items.findIndex(item => item._id === id);
  if (idx === -1) return null;
  const item = items[idx];
  applyUpdate(item, update);
  item.updatedAt = now();
  items[idx] = item;
  write(name, items);
  return opts.new !== false ? item : null;
}

export function findByIdAndDelete<T = any>(
  name: string,
  id: string,
): T | null {
  const items = read<any>(name);
  const idx = items.findIndex(item => item._id === id);
  if (idx === -1) return null;
  const deleted = items.splice(idx, 1)[0];
  write(name, items);
  return deleted as T;
}

export function countDocuments(name: string, filter: Record<string, any> = {}): number {
  return find(name, filter).length;
}

export function insertMany<T = any>(name: string, docs: any[]): T[] {
  const items = read<any>(name);
  const created = docs.map(d => ({
    _id: generateId(),
    ...d,
    createdAt: d.createdAt || now(),
    updatedAt: d.updatedAt || now(),
  }));
  items.push(...created);
  write(name, items);
  return created as T[];
}

export function updateMany(
  name: string,
  filter: Record<string, any>,
  update: Record<string, any>,
): number {
  const items = read<any>(name);
  let count = 0;
  for (const item of items) {
    if (matchesFilter(item, filter)) {
      applyUpdate(item, update);
      item.updatedAt = now();
      count++;
    }
  }
  write(name, items);
  return count;
}

export function bulkWrite(name: string, operations: any[]): void {
  const items = read<any>(name);
  for (const op of operations) {
    if (op.updateOne) {
      const { filter, update, upsert } = op.updateOne;
      const idx = items.findIndex(item => matchesFilter(item, filter));
      if (idx !== -1) {
        applyUpdate(items[idx], update);
        items[idx].updatedAt = now();
      } else if (upsert) {
        const doc: any = { _id: generateId(), createdAt: now(), updatedAt: now() };
        if (update.$set) {
          for (const key of Object.keys(update.$set)) {
            doc[key] = update.$set[key];
          }
        }
        items.push(doc);
      }
    }
  }
  write(name, items);
}

export function aggregate(name: string, pipeline: any[]): any[] {
  let items: any[] = read(name);

  for (const stage of pipeline) {
    if (stage.$match) {
      items = items.filter(item => matchesFilter(item, stage.$match));
    } else if (stage.$group) {
      const groups = new Map<string, any>();
      for (const item of items) {
        let groupKey: string;
        if (typeof stage.$group._id === 'string') {
          if (stage.$group._id.startsWith('$')) {
            const parts = stage.$group._id.slice(1).split('.');
            let val: any = item;
            for (const p of parts) val = val?.[p];
            groupKey = String(val ?? 'null');
          } else {
            groupKey = stage.$group._id;
          }
        } else if (typeof stage.$group._id === 'object') {
          const parts: string[] = [];
          for (const [k, v] of Object.entries(stage.$group._id)) {
            if (typeof v === 'string' && v.startsWith('$')) {
              const fieldParts = v.slice(1).split('.');
              let val: any = item;
              for (const p of fieldParts) val = val?.[p];
              parts.push(`${k}:${val ?? 'null'}`);
            } else {
              parts.push(`${k}:${v}`);
            }
          }
          groupKey = parts.join('|');
        } else {
          groupKey = 'null';
        }

        if (!groups.has(groupKey)) {
          const acc: any = { _id: groupKey };
          for (const [k, v] of Object.entries(stage.$group)) {
            if (k === '_id') continue;
            if (typeof v === 'object' && v !== null && '$sum' in v) {
              acc[k] = 0;
            } else if (typeof v === 'object' && v !== null && '$push' in v) {
              acc[k] = [];
            } else if (typeof v === 'object' && v !== null && '$first' in v) {
              acc[k] = undefined;
            }
          }
          groups.set(groupKey, acc);
        }

        const acc = groups.get(groupKey)!;
        for (const [k, v] of Object.entries(stage.$group)) {
          if (k === '_id') continue;
          if (typeof v === 'object' && v !== null && '$sum' in v) {
            const sumBy = (v as any).$sum;
            if (typeof sumBy === 'string' && sumBy.startsWith('$')) {
              const parts = sumBy.slice(1).split('.');
              let val: any = item;
              for (const p of parts) val = val?.[p];
              acc[k] += typeof val === 'number' ? val : 0;
            } else {
              acc[k] += typeof sumBy === 'number' ? sumBy : 1;
            }
          } else if (typeof v === 'object' && v !== null && '$push' in v) {
            const field = (v as any).$push;
            if (typeof field === 'string' && field.startsWith('$')) {
              const f = field.slice(1);
              const parts = f.split('.');
              let val: any = item;
              for (const p of parts) val = val?.[p];
              acc[k].push(val);
            } else if (typeof field === 'object' && field !== null) {
              const resolved: Record<string, any> = {};
              for (const [fk, fv] of Object.entries(field)) {
                if (typeof fv === 'string' && fv.startsWith('$')) {
                  const parts = fv.slice(1).split('.');
                  let val: any = item;
                  for (const p of parts) val = val?.[p];
                  resolved[fk] = val ?? fv;
                } else {
                  resolved[fk] = fv;
                }
              }
              acc[k].push(resolved);
            } else {
              acc[k].push(field);
            }
          }
        }

        if (typeof stage.$group._id === 'object' && !stage.$group._id.startsWith?.('$')) {
          const resolvedId: Record<string, any> = {};
          for (const [k, v] of Object.entries(stage.$group._id)) {
            if (typeof v === 'string' && v.startsWith('$')) {
              const fieldParts = v.slice(1).split('.');
              let val: any = item;
              for (const p of fieldParts) val = val?.[p];
              resolvedId[k] = val ?? null;
            }
          }
          acc._id = resolvedId;
        }
      }
      items = Array.from(groups.values());
    } else if (stage.$lookup) {
      const { from, localField, foreignField, as } = stage.$lookup;
      const foreignItems = read<any>(from);
      for (const item of items) {
        const localVal = item[localField];
        item[as] = foreignItems.filter((fi: any) => {
          const fv = fi[foreignField];
          if (Array.isArray(localVal)) return localVal.includes(fv);
          return fv === localVal || String(fv) === String(localVal);
        });
      }
    } else if (stage.$unwind) {
      const field = typeof stage.$unwind === 'string'
        ? stage.$unwind.replace(/^\$/, '')
        : stage.$unwind.path?.replace(/^\$/, '');
      const unwound: any[] = [];
      for (const item of items) {
        const arr = item[field];
        if (Array.isArray(arr)) {
          for (const el of arr) {
            unwound.push({ ...item, [field]: el });
          }
        } else {
          unwound.push(item);
        }
      }
      items = unwound;
    } else if (stage.$sort) {
      const keys = Object.entries(stage.$sort);
      items.sort((a, b) => {
        for (const [key, dir] of keys) {
          const av = resolveNested(a, key);
          const bv = resolveNested(b, key);
          if (av < bv) return -(dir as number);
          if (av > bv) return dir as number;
        }
        return 0;
      });
    } else if (stage.$limit) {
      items = items.slice(0, stage.$limit);
    } else if (stage.$project) {
      items = items.map(item => {
        const projected: Record<string, any> = {};
        for (const [k, v] of Object.entries(stage.$project)) {
          if (v === 1) {
            projected[k] = item[k];
          } else if (typeof v === 'string' && v.startsWith('$')) {
            projected[k] = resolveNested(item, v.slice(1));
          } else {
            projected[k] = v;
          }
        }
        return projected;
      });
    }
  }

  return items;
}

function resolveNested(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}

function selectFields<T extends Record<string, any>>(item: T, fields: string): Partial<T> {
  if (!fields) return item;
  const exclude = fields.startsWith('-');
  const fieldList = fields.replace(/^-/, '').split(/\s+/).filter(Boolean);
  if (exclude) {
    const result = { ...item };
    for (const f of fieldList) delete result[f as keyof T];
    return result;
  }
  const result: Partial<T> = {};
  for (const f of fieldList) {
    if (f in item) result[f as keyof T] = item[f];
  }
  return { _id: item._id, ...result };
}

export class JQ<T extends Record<string, any> = any> {
  private _select?: string;
  private _sort?: Record<string, number>;
  private _limit?: number;
  private _populates: Array<{ field: string; select: string }> = [];
  private _lean = false;

  constructor(
    private collection: string,
    private filter: Record<string, any>,
  ) {}

  select(fields: string): this {
    this._select = fields;
    return this;
  }

  sort(sortObj: Record<string, number>): this {
    this._sort = sortObj;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  populate(field: string, select?: string): this {
    this._populates.push({ field, select: select || '' });
    return this;
  }

  lean(): this {
    this._lean = true;
    return this;
  }

  private refName(field: string): string {
    const singular = field.endsWith('s') ? field.slice(0, -1) : field;
    const map: Record<string, string> = {
      student: 'users',
      teacher: 'users',
      markedBy: 'users',
      session: 'sessions',
      class: 'classes',
    };
    return map[singular] || map[field] || `${singular}s`;
  }

  exec(): Promise<T[]> {
    let results = find<T>(this.collection, this.filter);

    for (const pop of this._populates) {
      const ref = this.refName(pop.field);
      const refData = read<Record<string, any>>(ref);
      results = results.map(item => {
        const idVal = (item as any)[pop.field];
        if (!idVal) return item;
        if (Array.isArray(idVal)) {
          const matched = refData.filter(r => idVal.includes(r._id));
          (item as any)[pop.field] = pop.select
            ? matched.map(r => selectFields(r, pop.select))
            : matched;
        } else {
          const matched = refData.find(r => r._id === idVal);
          (item as any)[pop.field] = matched
            ? (pop.select ? selectFields(matched, pop.select) : matched)
            : idVal;
        }
        return item;
      });
    }

    if (this._sort) {
      const keys = Object.entries(this._sort);
      results.sort((a, b) => {
        for (const [key, dir] of keys) {
          const av = (a as any)[key];
          const bv = (b as any)[key];
          if (av < bv) return -(dir as number);
          if (av > bv) return dir as number;
        }
        return 0;
      });
    }

    if (this._limit) {
      results = results.slice(0, this._limit);
    }

    if (this._select) {
      results = results.map(item => selectFields(item, this._select!)) as T[];
    }

    return Promise.resolve(results);
  }

  then<TResult1 = T[], TResult2 = never>(
    resolve?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(resolve || undefined, reject || undefined);
  }

  catch<TResult = never>(
    reject?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T[] | TResult> {
    return this.exec().catch(reject || undefined);
  }
}

export function findQuery<T extends Record<string, any> = any>(
  collection: string,
  filter: Record<string, any> = {},
): JQ<T> {
  return new JQ<T>(collection, filter);
}

export class SingleJQ<T extends Record<string, any> = any> {
  private _select?: string;
  private _populates: Array<{ field: string; select: string }> = [];

  constructor(
    private collection: string,
    private id: string,
  ) {}

  select(fields: string): this {
    this._select = fields;
    return this;
  }

  populate(field: string, select?: string): this {
    this._populates.push({ field, select: select || '' });
    return this;
  }

  private refName(field: string): string {
    const singular = field.endsWith('s') ? field.slice(0, -1) : field;
    const map: Record<string, string> = {
      student: 'users', teacher: 'users', markedBy: 'users',
      session: 'sessions', class: 'classes',
    };
    return map[singular] || map[field] || `${singular}s`;
  }

  exec(): Promise<T | null> {
    let result = findById<T>(this.collection, this.id);
    if (!result) return Promise.resolve(null);

    for (const pop of this._populates) {
      const ref = this.refName(pop.field);
      const refData = read<Record<string, any>>(ref);
      const idVal = (result as any)[pop.field];
      if (idVal) {
        if (Array.isArray(idVal)) {
          const matched = refData.filter(r => idVal.includes(r._id));
          (result as any)[pop.field] = pop.select
            ? matched.map(r => selectFields(r, pop.select))
            : matched;
        } else {
          const matched = refData.find(r => r._id === idVal);
          (result as any)[pop.field] = matched
            ? (pop.select ? selectFields(matched, pop.select) : matched)
            : idVal;
        }
      }
    }

    if (this._select) {
      result = selectFields(result, this._select) as T;
    }

    return Promise.resolve(result);
  }

  then<TResult1 = T | null, TResult2 = never>(
    resolve?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(resolve || undefined, reject || undefined);
  }

  catch<TResult = never>(
    reject?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | null | TResult> {
    return this.exec().catch(reject || undefined);
  }
}

export { read as readCollection, write as writeCollection };
