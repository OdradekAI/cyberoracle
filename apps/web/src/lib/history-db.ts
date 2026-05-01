import Dexie, { type EntityTable } from 'dexie';

export interface HistoryEntry {
  id: string;
  type: 'palm' | 'face';
  date: string;
  summary: string;
}

const MAX_ENTRIES = 20;

const db = new Dexie('CyberOracleHistory') as Dexie & {
  readings: EntityTable<HistoryEntry, 'id'>;
};

db.version(1).stores({
  readings: 'id, type, date',
});

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  await db.readings.add(entry);

  const count = await db.readings.count();
  if (count > MAX_ENTRIES) {
    const oldest = await db.readings
      .orderBy('date')
      .limit(count - MAX_ENTRIES)
      .toArray();
    const ids = oldest.map((e) => e.id);
    await db.readings.bulkDelete(ids);
  }
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  return db.readings.orderBy('date').reverse().toArray();
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  return db.readings.get(id);
}

export async function clearHistory(): Promise<void> {
  await db.readings.clear();
}
