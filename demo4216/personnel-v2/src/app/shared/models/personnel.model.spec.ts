import {
  currentTaskIndex,
  currentTaskIndices,
  doneLabel,
  fullName,
  minutesOf,
  PlanningTask,
  QUANTITIES,
  QUANTITY_LABEL,
  REFUSAL_REASONS,
  slotLabel,
} from './personnel.model';

describe('personnel.model', () => {
  it('writes the last name in capitals', () => {
    expect(fullName({ firstName: 'Michel', lastName: 'Durand' })).toBe('Michel DURAND');
  });

  it('translates known slots and keeps unknown ones', () => {
    expect(slotLabel('DEJEUNER')).toBe('Déjeuner');
    expect(slotLabel('DINER')).toBe('Dîner');
    expect(slotLabel('INCONNU')).toBe('INCONNU');
  });

  it('says "Servi" for a meal and "Donné" for a medication', () => {
    expect(doneLabel('REPAS')).toBe('Servi');
    expect(doneLabel('MEDICAMENT')).toBe('Donné');
  });

  it('has a label for every quantity', () => {
    for (const quantity of QUANTITIES) {
      expect(QUANTITY_LABEL[quantity]).toBeTruthy();
    }
  });

  it('offers refusal reasons for meals and medications', () => {
    expect(REFUSAL_REASONS.REPAS.length).toBeGreaterThan(0);
    expect(REFUSAL_REASONS.MEDICAMENT.length).toBeGreaterThan(0);
  });

  describe('planning', () => {
    const task = (start: string, end: string): PlanningTask => ({ start, end, label: start, kind: 'SOINS', focus: null });

    it('converts HH:mm to minutes', () => {
      expect(minutesOf('07:30')).toBe(450);
    });

    it('finds the current slot of a day shift', () => {
      const tasks = [task('06:30', '07:00'), task('07:00', '09:30'), task('13:00', '13:30')];
      expect(currentTaskIndex(tasks, 'JOUR', 7 * 60 + 10)).toBe(1);
      expect(currentTaskIndex(tasks, 'JOUR', 13 * 60 + 15)).toBe(2);
      expect(currentTaskIndex(tasks, 'JOUR', 10 * 60)).toBe(-1);
    });

    it('handles a night shift that runs past midnight', () => {
      const tasks = [task('21:00', '21:30'), task('23:30', '23:59'), task('00:00', '03:00')];
      expect(currentTaskIndex(tasks, 'NUIT', 21 * 60 + 5)).toBe(0);
      expect(currentTaskIndex(tasks, 'NUIT', 23 * 60 + 59)).toBe(1);
      expect(currentTaskIndex(tasks, 'NUIT', 60)).toBe(2);
    });

    it('reports overlapping slots together', () => {
      const tasks = [task('11:00', '11:30'), task('11:30', '13:00'), task('11:30', '13:00')];
      expect(currentTaskIndices(tasks, 'JOUR', 12 * 60)).toEqual([1, 2]);
      expect(currentTaskIndices(tasks, 'JOUR', 11 * 60 + 10)).toEqual([0]);
    });
  });
});
