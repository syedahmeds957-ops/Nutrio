import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme.js';

export type NavTabKey = 'home' | 'plan' | 'weight' | 'coach';

interface BottomDockNavProps {
  activeTab: NavTabKey;
  onSelectTab: (tab: NavTabKey) => void;
}

export const BottomDockNav: React.FC<BottomDockNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.dockWrapper}>
      <View style={styles.dock}>
        <TouchableOpacity
          style={[styles.dockItem, activeTab === 'home' && styles.activeDockItem]}
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
        >
          <Text style={styles.dockIcon}>🏠</Text>
          <Text style={[styles.dockLabel, activeTab === 'home' && styles.activeDockLabel]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dockItem, activeTab === 'plan' && styles.activeDockItem]}
          onPress={() => onSelectTab('plan')}
          activeOpacity={0.7}
        >
          <Text style={styles.dockIcon}>📅</Text>
          <Text style={[styles.dockLabel, activeTab === 'plan' && styles.activeDockLabel]}>
            Plans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dockItem, activeTab === 'weight' && styles.activeDockItem]}
          onPress={() => onSelectTab('weight')}
          activeOpacity={0.7}
        >
          <Text style={styles.dockIcon}>⚖️</Text>
          <Text style={[styles.dockLabel, activeTab === 'weight' && styles.activeDockLabel]}>
            Weight
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dockItem, activeTab === 'coach' && styles.activeDockItem]}
          onPress={() => onSelectTab('coach')}
          activeOpacity={0.7}
        >
          <Text style={styles.dockIcon}>🧑‍⚕️</Text>
          <Text style={[styles.dockLabel, activeTab === 'coach' && styles.activeDockLabel]}>
            Coach
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 380,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dockItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  activeDockItem: {
    backgroundColor: theme.colors.primaryLight,
  },
  dockIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeDockLabel: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
});
