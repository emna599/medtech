import { doneLabel, fullName, QUANTITIES, QUANTITY_LABEL, REFUSAL_REASONS, slotLabel } from './personnel.model';

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
});
