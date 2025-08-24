import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

interface CustomDropdownProps {
  label: string;
  open: boolean;
  value: any;
  items: Array<{ label: string; value: string }>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setValue: React.Dispatch<React.SetStateAction<any>>;
  setItems: React.Dispatch<React.SetStateAction<Array<{ label: string; value: string }>>>;
  placeholder?: string;
  zIndex?: number;
}

const CustomDropdown = ({
  label,
  open,
  value,
  items,
  setOpen,
  setValue,
  setItems,
  placeholder = "Select an option",
  zIndex = 1000
}: CustomDropdownProps) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        placeholder={placeholder}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        zIndex={zIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e3e3e3',
    borderRadius: 10,
    height: 45,
  },
  dropdownContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e3e3e3',
    borderRadius: 10,
  },
});

export default CustomDropdown;
