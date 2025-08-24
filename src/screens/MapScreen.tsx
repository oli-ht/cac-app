import { useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native'
import MapView, { Marker, UrlTile, Region } from 'react-native-maps'
import * as Location from 'expo-location'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>

export default function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null)
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null)

  // search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  // get current location on mount
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      const next: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
      setRegion(next)
      mapRef.current?.animateToRegion(next, 500)
    })()
  }, [])

  // fetch OSM search results
  const searchPlaces = async (text: string) => {
    setQuery(text)
    if (text.length < 3) {
      setResults([])
      return
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`
      )
      const data = await res.json()
      setResults(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelect = (place: any) => {
    const lat = parseFloat(place.lat)
    const lon = parseFloat(place.lon)
    const next: Region = { latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    setMarker({ latitude: lat, longitude: lon })
    setRegion(next)
    mapRef.current?.animateToRegion(next, 600)
    setResults([])
    setQuery(place.display_name)
    navigation.navigate('Place', {
      name: place.display_name,
      latitude: lat,
      longitude: lon,
    })
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={region}>
        {/* Use OSM tiles */}
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {/* search box */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={searchPlaces}
          placeholder="Search places"
          style={styles.textInput}
        />
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item, i) => i.toString()}
            style={styles.listView}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item)} style={styles.resultItem}>
                <Text numberOfLines={1}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  searchWrap: {
    position: 'absolute',
    top: Platform.select({ ios: 60, android: 40 }),
    left: 16,
    right: 16,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 200,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
})
