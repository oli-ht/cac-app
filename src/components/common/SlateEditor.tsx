import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface SlateEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange }) => {
  const richText = useRef<RichEditor>(null);

  return (
    <View style={styles.container}>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.heading1,
          actions.heading2,
          actions.paragraph,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
        ]}
        style={styles.toolbar}
      />
      <RichEditor
        ref={richText}
        initialContentHTML={value}
        onChange={onChange}
        placeholder="Write your content here..."
        style={styles.editor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editor: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
});

export default SlateEditor;