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
  totalMonths: number;
  savedAmount: number;
  createdAt: Date;
}

export interface ProjectBudget {
  id?: number;
  title: string;
  targetAmount: number;
  sectors: { name: string; amount: number }[];
  createdAt: Date;
}

export class RabbiDatabase extends Dexie {
  transactions!: Table<Transaction>;
  notes!: Table<Note>;
  budgets!: Table<Budget>;
  goals!: Table<Goal>;
  projectBudgets!: Table<ProjectBudget>;

  constructor() {
    super('RabbiDB');
    this.version(2).stores({
      transactions: '++id, type, category, date',
      notes: '++id, title, createdAt, updatedAt',
      budgets: '++id, [month+category]',
      goals: '++id, title',
      projectBudgets: '++id, title'
    });
  }
}

export const db = new RabbiDatabase();
