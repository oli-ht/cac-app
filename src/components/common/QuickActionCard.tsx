import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface QuickActionCardProps {
  action: {
    id: string;
    title: string;
    subtitle: string;
    icon?: string;
    color: string;
  };
  onPress?: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  action, 
  onPress 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.actionCard, { backgroundColor: action.color }]} 
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚡</Text>
      </View>
      <Text style={styles.actionTitle}>{action.title}</Text>
      <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    width: 120,
    height: 100,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-start',
  },
  iconText: {
    fontSize: 20,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default QuickActionCard; 