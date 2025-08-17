import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    image?: string;
  };
  onPress?: () => void;
  isActive?: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onPress, 
  isActive = false 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.categoryCard, 
        isActive && styles.activeCategoryCard
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.categoryName,
        isActive && styles.activeCategoryName
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCategoryCard: {
    backgroundColor: '#4A5C9E',
  },
  categoryName: {
    color: '#4A5C9E',
    fontSize: 16,
    fontWeight: '600',
  },
  activeCategoryName: {
    color: '#FFFFFF',
  },
});

export default CategoryCard; 