import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LearningGoalCardProps {
  currentMinutes: number;
  totalMinutes: number;
}

const LearningGoalCard: React.FC<LearningGoalCardProps> = ({ currentMinutes, totalMinutes }) => {
  const progress = totalMinutes > 0 ? (currentMinutes / totalMinutes) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning goal</Text>
        <TouchableOpacity>
          <Text style={styles.link}>My courses</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <Text style={styles.minutes}>{currentMinutes}min</Text>
        <Text style={styles.totalMinutes}>/ {totalMinutes}min</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    fontFamily: 'EbgaramondSemiBold',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    fontFamily: 'EbgaramondSemiBold',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'EbgaramondSemiBold',
    fontSize: 16,
    color: '#666',
  },
  link: {
    fontSize: 14,
    color: '#2EB5FA',
    fontWeight: 'bold',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  minutes: {
    fontFamily: 'NotoSerifBold',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  totalMinutes: {
    fontSize: 16,
    color: '#999',
    marginLeft: 5,
    marginBottom: 5,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5BC8FF',
    borderRadius: 4,
  },
});

export default LearningGoalCard;
