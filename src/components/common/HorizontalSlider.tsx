import React from 'react';
import {
  ScrollView,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';

interface HorizontalSliderProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  containerStyle?: ViewStyle;
  itemSpacing?: number;
  showsHorizontalScrollIndicator?: boolean;
}

const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  data,
  renderItem,
  containerStyle,
  itemSpacing = 15,
  showsHorizontalScrollIndicator = false,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      style={[styles.container, containerStyle]}
      contentContainerStyle={styles.contentContainer}
    >
      {data.map((item, index) => (
        <React.Fragment key={item.id || index}>
          {renderItem(item, index)}
          {index < data.length - 1 && (
            <View style={{ width: itemSpacing }} />
          )}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
});

export default HorizontalSlider; 