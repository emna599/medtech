import { DiningSeat, DiningTable, isMealFinished, seatSlots } from '../../../shared/models/personnel.model';
import { isoDate } from '../menu-dialog/menu-dialog';

function seat(position: number): DiningSeat {
  return { position, resident: { id: position } as DiningSeat['resident'], chevalet: null, meal: null };
}

describe('salle à manger', () => {
  it('représente les 8 places d\'une table, les libres étant vides', () => {
    const table: DiningTable = { id: 1, label: 'Table 1', capacity: 8, present: 2, served: 0, readerCode: 'TR1', seats: [seat(1), seat(2)] };
    const slots = seatSlots(table);
    expect(slots).toHaveLength(8);
    expect(slots[0]?.position).toBe(1);
    expect(slots[1]?.position).toBe(2);
    expect(slots.filter((s) => s === null)).toHaveLength(6);
  });

  it('considère un repas servi ou refusé comme terminé', () => {
    expect(isMealFinished({ id: 1, description: null, status: 'FAIT' })).toBe(true);
    expect(isMealFinished({ id: 1, description: null, status: 'REFUSE' })).toBe(true);
    expect(isMealFinished({ id: 1, description: null, status: 'A_FAIRE' })).toBe(false);
    expect(isMealFinished(null)).toBe(false);
  });

  it('formate la date locale sans décalage UTC', () => {
    expect(isoDate(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });
});
