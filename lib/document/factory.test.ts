import { describe, it, expect } from 'vitest';
import { createBlankDoc } from './factory';
import { screenstylerDocSchema } from './schema';

describe('createBlankDoc', () => {
  it('produces a schema-valid document', () => {
    expect(() => screenstylerDocSchema.parse(createBlankDoc())).not.toThrow();
  });

  it('starts with no image and an empty annotation list', () => {
    const doc = createBlankDoc();
    expect(doc.content.image).toBeNull();
    expect(doc.annotations).toEqual([]);
  });
});
