import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: Date;
}

export interface Note {
  id?: number;
  title: string;
  content: string;
  images: string[]; // Base64 strings
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id?: number;
  month: string; // YYYY-MM
  category: string;
  amount: number;
}

export interface Goal {
  id?: number;
  title: string;
  targetAmount: number;
  years: number;
  createdAt: Date;
}

export class ProttoyDatabase extends Dexie {
  transactions!: Table<Transaction>;
  notes!: Table<Note>;
  budgets!: Table<Budget>;
  goals!: Table<Goal>;

  constructor() {
    super('ProttoyDB');
    this.version(1).stores({
      transactions: '++id, type, category, date',
      notes: '++id, title, createdAt, updatedAt',
      budgets: '++id, [month+category]',
      goals: '++id, title'
    });
  }
}

export const db = new ProttoyDatabase();
