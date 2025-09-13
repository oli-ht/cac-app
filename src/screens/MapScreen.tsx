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
  Alert,
} from 'react-native'
import MapView, { Marker, UrlTile, Region, Polyline } from 'react-native-maps'
import * as Location from 'expo-location'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../App'

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>

interface MedicalFacility {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string
  type: string
  distance?: number
}

export default function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null)
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<{ latitude: number; longitude: number } | null>(null)
  const [medicalFacilities, setMedicalFacilities] = useState<MedicalFacility[]>([])
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([])

  // search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searchMode, setSearchMode] = useState<'general' | 'medical'>('general')

  // get current location on mount
  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to show your current location')
        return
      }
      
      try {
        const loc = await Location.getCurrentPositionAsync({})
        const userCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }
        setUserLocation(userCoords)
        
        const next: Region = {
          ...userCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
        setRegion(next)
        mapRef.current?.animateToRegion(next, 500)
        
        // Automatically search for nearby medical facilities
        searchNearbyMedicalFacilities(userCoords.latitude, userCoords.longitude)
      } catch (error) {
        console.error('Error getting location:', error)
        Alert.alert('Error', 'Unable to get your current location')
      }
    })()
  }, [])

  // Search for nearby medical facilities using Overpass API
  const searchNearbyMedicalFacilities = async (lat: number, lon: number, radius: number = 5000) => {
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$"](around:${radius},${lat},${lon});
          way["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$"](around:${radius},${lat},${lon});
          relation["amenity"~"^(hospital|clinic|doctors|dentist|pharmacy|veterinary)$"](around:${radius},${lat},${lon});
        );
        out center meta;
      `
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      })
      
      const data = await response.json()
      
      const facilities: MedicalFacility[] = data.elements.map((element: any) => {
        const coords = element.lat && element.lon 
          ? { lat: element.lat, lon: element.lon }
          : element.center
        
        const distance = calculateDistance(lat, lon, coords.lat, coords.lon)
        
        return {
          id: element.id.toString(),
          name: element.tags?.name || `${element.tags?.amenity} facility`,
          latitude: coords.lat,
          longitude: coords.lon,
          address: element.tags?.['addr:street'] ? 
            `${element.tags['addr:street']} ${element.tags['addr:housenumber'] || ''}` : 
            'Address not available',
          type: element.tags?.amenity || 'medical',
          distance: distance
        }
      }).filter((facility: MedicalFacility) => facility.name && facility.latitude && facility.longitude)
      .sort((a: MedicalFacility, b: MedicalFacility) => (a.distance || 0) - (b.distance || 0))
      
      setMedicalFacilities(facilities)
    } catch (error) {
      console.error('Error fetching medical facilities:', error)
      Alert.alert('Error', 'Unable to load nearby medical facilities')
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Get route between two points using OSRM
  const getRoute = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
      )
      const data = await response.json()
      
      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0]
        }))
        setRouteCoordinates(coordinates)
        
        // Fit map to show entire route
        const allCoords = [
          { latitude: startLat, longitude: startLon },
          { latitude: endLat, longitude: endLon },
          ...coordinates
        ]
        mapRef.current?.fitToCoordinates(allCoords, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        })
      }
    } catch (error) {
      console.error('Error getting route:', error)
      Alert.alert('Error', 'Unable to get directions')
    }
  }

  // General place search (your existing functionality)
  const searchPlaces = async (text: string) => {
    setQuery(text)
    setSearchMode('general')
    
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

  // Search medical facilities by name
  const searchMedicalFacilities = async (text: string) => {
    setQuery(text)
    setSearchMode('medical')
    
    if (text.length < 2) {
      setResults([])
      return
    }
    
    const filtered = medicalFacilities.filter(facility =>
      facility.name.toLowerCase().includes(text.toLowerCase()) ||
      facility.type.toLowerCase().includes(text.toLowerCase())
    )
    setResults(filtered)
  }

  const handleGeneralSelect = (place: any) => {
    const lat = parseFloat(place.lat)
    const lon = parseFloat(place.lon)
    const next: Region = { latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    setSelectedMarker({ latitude: lat, longitude: lon })
    setRegion(next)
    mapRef.current?.animateToRegion(next, 600)
    setResults([])
    setQuery(place.display_name)
    setRouteCoordinates([]) // Clear any existing route
    
    navigation.navigate('Place', {
      name: place.display_name,
      latitude: lat,
      longitude: lon,
    })
  }

  const handleMedicalFacilitySelect = (facility: MedicalFacility) => {
    const next: Region = { 
      latitude: facility.latitude, 
      longitude: facility.longitude, 
      latitudeDelta: 0.01, 
      longitudeDelta: 0.01 
    }
    setSelectedMarker({ latitude: facility.latitude, longitude: facility.longitude })
    setRegion(next)
    mapRef.current?.animateToRegion(next, 600)
    setResults([])
    setQuery(facility.name)
    
    // Get directions if user location is available
    if (userLocation) {
      getRoute(userLocation.latitude, userLocation.longitude, facility.latitude, facility.longitude)
    }
    
    navigation.navigate('Place', {
      name: facility.name,
      latitude: facility.latitude,
      longitude: facility.longitude,
    })
  }

  const clearRoute = () => {
    setRouteCoordinates([])
  }

  const getMedicalIcon = (type: string) => {
    switch (type) {
      case 'hospital': return '🏥'
      case 'clinic': return '🏥'
      case 'doctors': return '👨‍⚕️'
      case 'dentist': return '🦷'
      case 'pharmacy': return '💊'
      case 'veterinary': return '🐾'
      default: return '⚕️'
    }
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={region}>
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}
        
        {/* Selected marker */}
        {selectedMarker && (
          <Marker coordinate={selectedMarker} />
        )}
        
        {/* Medical facility markers */}
        {medicalFacilities.map((facility) => (
          <Marker
            key={facility.id}
            coordinate={{ latitude: facility.latitude, longitude: facility.longitude }}
            title={facility.name}
            description={`${facility.type} • ${facility.distance?.toFixed(1)} km`}
            onPress={() => handleMedicalFacilitySelect(facility)}
          >
            <View style={styles.medicalMarker}>
              <Text style={styles.markerText}>{getMedicalIcon(facility.type)}</Text>
            </View>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[5, 10]}
          />
        )}
      </MapView>

      {/* Search interface */}
      <View style={styles.searchWrap}>
        {/* Search mode buttons */}
        <View style={styles.searchModeButtons}>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'general' && styles.activeModeButton]}
            onPress={() => {
              setSearchMode('general')
              setQuery('')
              setResults([])
            }}
          >
            <Text style={[styles.modeButtonText, searchMode === 'general' && styles.activeModeButtonText]}>
              Places
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, searchMode === 'medical' && styles.activeModeButton]}
            onPress={() => {
              setSearchMode('medical')
              setQuery('')
              setResults([])
            }}
          >
            <Text style={[styles.modeButtonText, searchMode === 'medical' && styles.activeModeButtonText]}>
              Medical
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          value={query}
          onChangeText={searchMode === 'medical' ? searchMedicalFacilities : searchPlaces}
          placeholder={searchMode === 'medical' ? "Search medical facilities..." : "Search places..."}
          style={styles.textInput}
        />
        
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item, i) => i.toString()}
            style={styles.listView}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => searchMode === 'medical' ? handleMedicalFacilitySelect(item) : handleGeneralSelect(item)} 
                style={styles.resultItem}
              >
                <View style={styles.resultContent}>
                  {searchMode === 'medical' ? (
                    <>
                      <Text style={styles.facilityIcon}>{getMedicalIcon(item.type)}</Text>
                      <View style={styles.facilityInfo}>
                        <Text numberOfLines={1} style={styles.facilityName}>{item.name}</Text>
                        <Text numberOfLines={1} style={styles.facilityDetails}>
                          {item.type} • {item.distance?.toFixed(1)} km
                        </Text>
                        <Text numberOfLines={1} style={styles.facilityAddress}>{item.address}</Text>
                      </View>
                    </>
                  ) : (
                    <Text numberOfLines={1}>{item.display_name}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Clear route button */}
        {routeCoordinates.length > 0 && (
          <TouchableOpacity style={styles.clearRouteButton} onPress={clearRoute}>
            <Text style={styles.clearRouteText}>Clear Route</Text>
          </TouchableOpacity>
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
  searchModeButtons: {
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#fff',
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
    maxHeight: 250,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  facilityDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  facilityAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  medicalMarker: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  markerText: {
    fontSize: 14,
  },
  clearRouteButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  clearRouteText: {
    color: '#fff',
    fontWeight: '500',
  },
})