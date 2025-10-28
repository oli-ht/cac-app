import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecentActivityCardProps {
  action: {
    id: string;
    title: string;
    subtitle: string;
    icon?: string;
    color: string;
  };
  onPress?: () => void;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ 
  action, 
  onPress 
}) => {
  return (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.colorBar, { backgroundColor: action.color }]} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={24} color={action.color} />
        </View>
        <Text style={styles.actionTitle} numberOfLines={2}>{action.title}</Text>
        <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionCard: {
    width: 160,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  actionTitle: {
    color: '#333',
    fontSize: 15,
    fontFamily: 'EbgaramondSemiBold',
    lineHeight: 20,
    flex: 1,
  },
  actionSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});

export default RecentActivityCard; 