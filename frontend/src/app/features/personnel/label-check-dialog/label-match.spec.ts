import { ResidentCard } from '../../../shared/models/personnel.model';
import { matchResident, normalizeText, parseLabel } from './label-match';

function resident(id: number, lastName: string, firstName: string, room: string, age = 85): ResidentCard {
  return { id, lastName, firstName, room, age } as ResidentCard;
}

const RESIDENTS = [
  resident(1, 'Lambert', 'Marie', '1', 89),
  resident(2, 'Lefèvre', 'Louis', '13', 88),
  resident(3, 'Colin', 'Danielle', '40'),
  resident(4, 'Colin', 'Daniel', '41'),
];

const LABEL = `LAMBERT MARIE
Âge : 89 ans
Chambre : 1
MÉDICAMENT(S) :
Metformine 1000mg
EHPAD Les Jardins
Date : 27/11/2026 - 08:08`;

describe('label-match', () => {
  it('retire les accents et la ponctuation', () => {
    expect(normalizeText('Lefèvre-Louis')).toBe('LEFEVRE LOUIS');
  });

  it("lit la chambre, l'âge, les médicaments et la date", () => {
    expect(parseLabel(LABEL)).toEqual({
      room: '1',
      age: 89,
      medications: ['Metformine 1000mg'],
      date: '27/11/2026 - 08:08',
    });
  });

  it('retrouve le résident, nom et prénom dans un ordre quelconque', () => {
    const result = matchResident(LABEL, RESIDENTS);
    expect(result.status).toBe('FOUND');
    expect(matchResident('Marie LAMBERT\nChambre : 1', RESIDENTS).status).toBe('FOUND');
  });

  it('tolère une lettre mal lue', () => {
    const result = matchResident('LEFEVRF LOUIS\nÂge : 88 ans\nChambre : 13', RESIDENTS);
    expect(result.status === 'FOUND' && result.resident.id).toBe(2);
  });

  it('départage deux prénoms proches grâce à la chambre', () => {
    const result = matchResident('COLIN DANIELLE\nChambre : 40', RESIDENTS);
    expect(result.status === 'FOUND' && result.resident.id).toBe(3);
  });

  it("ne propose rien si le nom n'est pas dans la base", () => {
    expect(matchResident('DUPONT PAUL\nChambre : 3', RESIDENTS).status).toBe('NOT_FOUND');
  });
});
