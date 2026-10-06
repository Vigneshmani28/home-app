import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/layout/screen-header';
import type { LegalBlock, LegalContent } from '@/features/legal/types';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') {
    return <Text style={styles.paragraph}>{block}</Text>;
  }
  if ('list' in block) {
    return (
      <View style={styles.list}>
        {block.list.map((item) => (
          <View key={item} style={styles.listRow}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.note}>
      <Ionicons name="information-circle" size={18} color={primary[500]} />
      <Text style={styles.noteText}>{block.note}</Text>
    </View>
  );
}

/** Reader-friendly legal page: a short summary, then numbered sections that can be folded away. */
export function LegalDocument({ content }: { content: LegalContent }) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const toggle = (index: number) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const allCollapsed = collapsed.size === content.sections.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScreenHeader title={content.title} subtitle={content.updated} showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Ionicons name={content.icon} size={22} color={primary[600]} />
            </View>
            <Text style={styles.summaryTitle}>The short version</Text>
          </View>
          {content.highlights.map((line) => (
            <View key={line} style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={18} color={primary[400]} style={styles.highlightIcon} />
              <Text style={styles.highlightText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.toolbar}>
          <Text style={styles.toolbarLabel}>{content.sections.length} sections</Text>
          <Pressable
            onPress={() =>
              setCollapsed(allCollapsed ? new Set() : new Set(content.sections.map((_, index) => index)))
            }
            hitSlop={8}
            accessibilityRole="button">
            <Text style={styles.toolbarAction}>{allCollapsed ? 'Expand all' : 'Collapse all'}</Text>
          </Pressable>
        </View>

        {content.sections.map((section, index) => {
          const isCollapsed = collapsed.has(index);
          return (
            <View key={section.title} style={styles.card}>
              <Pressable
                onPress={() => toggle(index)}
                accessibilityRole="button"
                accessibilityState={{ expanded: !isCollapsed }}
                style={styles.cardHeader}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={18} color={neutral[400]} />
              </Pressable>

              {isCollapsed ? null : (
                <View style={styles.cardBody}>
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Ionicons name="document-text-outline" size={18} color={neutral[300]} />
          <Text style={styles.footerText}>{content.footer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  summary: {
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: primary[50],
    borderWidth: 1,
    borderColor: primary[100],
    gap: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: primary[700],
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  highlightIcon: {
    marginTop: 1,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: neutral[700],
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  toolbarLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  toolbarAction: {
    fontSize: 13,
    fontWeight: '700',
    color: primary[500],
  },
  card: {
    marginBottom: spacing.sm,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: secondary[400],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  number: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primary[500],
  },
  numberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: neutral[800],
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  paragraph: {
    fontSize: 14.5,
    lineHeight: 22,
    color: neutral[600],
  },
  list: {
    gap: 8,
  },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 2,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    backgroundColor: primary[400],
  },
  listText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: neutral[600],
  },
  note: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: primary[50],
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: primary[700],
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  footerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: neutral[400],
  },
});
