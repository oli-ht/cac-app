import { View, Text, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Place'>

export default function PlaceScreen({ route }: Props) {
  const { name, latitude, longitude } = route.params
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text>Lat: {latitude.toFixed(6)}</Text>
      <Text>Lng: {longitude.toFixed(6)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
})
