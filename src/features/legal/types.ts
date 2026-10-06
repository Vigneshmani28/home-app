import type { Ionicons } from '@expo/vector-icons';

export type LegalIconName = React.ComponentProps<typeof Ionicons>['name'];

/** A paragraph, a bulleted list, or a highlighted note inside a section. */
export type LegalBlock = string | { list: string[] } | { note: string };

export interface LegalSection {
  title: string;
  icon: LegalIconName;
  blocks: LegalBlock[];
}

export interface LegalContent {
  title: string;
  /** Shown under the title, e.g. "Last updated: 5 October 2026". */
  updated: string;
  icon: LegalIconName;
  /** "The short version" bullets shown at the top. */
  highlights: string[];
  sections: LegalSection[];
  footer: string;
}
