import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface DataPoint {
  x: string;
  y: number;
}

// Temporary data for the bar chart, will eventually be replaced with actual data
const data: DataPoint[] = [
  { x: "Mon", y: 45 },
  { x: "Tue", y: 32 },
  { x: "Wed", y: 67 },
  { x: "Thu", y: 23 },
  { x: "Fri", y: 89 },
  { x: "Sat", y: 56 },
  { x: "Sun", y: 78 },
];

const maxValue = Math.max(...data.map(d => d.y));

export function SimpleBarChart() {
  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: (item.y / maxValue) * 120,
                    backgroundColor: '#2EB5FA'
                  }
                ]} 
              />
            </View>
            <Text style={styles.label}>{item.x}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: width - 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
}); 