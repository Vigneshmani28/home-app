import { Ionicons } from '@expo/vector-icons';

import { Pill } from '@/components/ui';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
}

export function CategoryChip({ label, selected, icon, onPress }: CategoryChipProps) {
  return <Pill label={label} selected={selected} icon={icon} onPress={onPress} />;
}
