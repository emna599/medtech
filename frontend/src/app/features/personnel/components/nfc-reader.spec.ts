import { tagValue } from './nfc-reader';

function record(recordType: string, text: string, encoding = 'utf-8') {
  return { recordType, encoding, data: new DataView(new TextEncoder().encode(text).buffer) };
}

describe('tagValue', () => {
  it('reads the text record of a tag', () => {
    const event = { message: { records: [record('text', ' NFC-DEMO-001 ')] } } as unknown as Event;
    expect(tagValue(event)).toBe('NFC-DEMO-001');
  });

  it('falls back to the serial number', () => {
    const event = { serialNumber: '04:aa:bb', message: { records: [] } } as unknown as Event;
    expect(tagValue(event)).toBe('04:aa:bb');
  });

  it('returns null for an empty tag', () => {
    expect(tagValue({ message: { records: [] } } as unknown as Event)).toBeNull();
  });
});
