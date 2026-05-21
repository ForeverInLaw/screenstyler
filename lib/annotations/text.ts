export const defaultTextFontFamily = 'inter';

export const textFontOptions = [
  { id: 'inter', label: 'Inter', family: 'Inter, system-ui, sans-serif' },
  { id: 'serif', label: 'Serif', family: 'Georgia, Times New Roman, serif' },
  { id: 'mono', label: 'Mono', family: 'JetBrains Mono, Consolas, monospace' },
  { id: 'condensed', label: 'Condensed', family: 'Arial Narrow, Roboto Condensed, sans-serif' },
] as const;

export function getTextFontFamily(fontFamily?: string) {
  return textFontOptions.find((font) => font.id === fontFamily)?.family ?? fontFamily ?? textFontOptions[0].family;
}

