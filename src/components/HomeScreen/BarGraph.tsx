import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Bar } from "victory-native";
import DATA from "./my-data";

const { width } = Dimensions.get('window');

interface DataPoint {
  x: string;
  y: number;
}

export function BarGraph() {
  return (
    <View style={styles.container}>
      <CartesianChart 
        data={DATA} 
        xKey="x" 
        yKeys={["y"]}
        domainPadding={{ left: 20, right: 20 }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.y}
            chartBounds={chartBounds}
            color="#2EB5FA"
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            animate={{ type: "timing", duration: 1000 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: width - 40, // Account for padding
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});