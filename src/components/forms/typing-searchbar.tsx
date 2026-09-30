import { useState } from 'react';
import { Searchbar, type SearchbarProps } from 'react-native-paper';

import { useTypewriter } from '@/hooks/use-typewriter';

interface TypingSearchbarProps extends Omit<SearchbarProps, 'placeholder'> {
  /** Words cycled through in the placeholder: "Search cement", "Search bricks"… Keep this array stable (module constant). */
  words: readonly string[];
  /** Static text used when the animation is paused (while focused or typing). */
  idlePlaceholder?: string;
}

/**
 * Search bar whose placeholder types out and deletes suggestions in a loop. It lives in its own
 * component so the ~10 state updates per second re-render only this bar, not the whole screen.
 */
export function TypingSearchbar({
  words,
  idlePlaceholder = 'Search materials...',
  value,
  onFocus,
  onBlur,
  ...props
}: TypingSearchbarProps) {
  const [focused, setFocused] = useState(false);
  const animating = !focused && !value;
  const typed = useTypewriter(words, animating);

  return (
    <Searchbar
      {...props}
      value={value}
      placeholder={animating ? `Search ${typed}` : idlePlaceholder}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}
