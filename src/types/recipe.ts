export type SerializedItem =
  | { type: 'text'; value: string }
  | { type: 'ingredient'; name: string }
  | { type: 'cookware'; name: string }
  | { type: 'timer'; duration: string; unit: string };

export type SerializedContent =
  | { type: 'step'; items: SerializedItem[] }
  | { type: 'note'; note: string };

export interface SerializedSection {
  name: string;
  content: SerializedContent[];
}
