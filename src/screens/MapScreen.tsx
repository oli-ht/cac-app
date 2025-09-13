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

const MEDICAL_TYPES = {
  hospital: { icon: '🏥', label: 'Hospitals', color: '#FF3B30' },
  clinic: { icon: '🏥', label: 'Clinics', color: '#007AFF' },
  doctors: { icon: '👨‍⚕️', label: 'Doctors', color: '#34C759' },
  dentist: { icon: '🦷', label: 'Dentists', color: '#FF9500' },
  pharmacy: { icon: '💊', label: 'Pharmacies', color: '#AF52DE' },
  veterinary: { icon: '🐾', label: 'Veterinary', color: '#8E8E93' },
}

export default function MapScreen({ }: Props) {
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
  const [filteredFacilities, setFilteredFacilities] = useState<MedicalFacility[]>([])
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([])
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(Object.keys(MEDICAL_TYPES)))
  const [showMapKey, setShowMapKey] = useState(false)

  // search state
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MedicalFacility[]>([])

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

  // Filter facilities when visible types change
  useEffect(() => {
    const filtered = medicalFacilities.filter(facility => visibleTypes.has(facility.type))
    setFilteredFacilities(filtered)
  }, [medicalFacilities, visibleTypes])

  // Search for nearby medical facilities using Overpass API
  const searchNearbyMedicalFacilities = async (lat: number, lon: number, radius: number = 8000) => {
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

  // Search medical facilities by name
  const searchMedicalFacilities = (text: string) => {
    setQuery(text)
    
    if (text.length < 2) {
      setSearchResults([])
      return
    }
    
    const filtered = medicalFacilities.filter(facility =>
      facility.name.toLowerCase().includes(text.toLowerCase()) ||
      facility.type.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 10) // Limit results
    
    setSearchResults(filtered)
  }

  const handleFacilitySelect = (facility: MedicalFacility) => {
    const next: Region = { 
      latitude: facility.latitude, 
      longitude: facility.longitude, 
      latitudeDelta: 0.01, 
      longitudeDelta: 0.01 
    }
    setSelectedMarker({ latitude: facility.latitude, longitude: facility.longitude })
    setRegion(next)
    mapRef.current?.animateToRegion(next, 600)
    setSearchResults([])
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

  const zoomToUserLocation = () => {
    if (userLocation) {
      const next: Region = {
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
      setRegion(next)
      mapRef.current?.animateToRegion(next, 600)
    } else {
      Alert.alert('Location not available', 'Unable to find your current location')
    }
  }

  const clearRoute = () => {
    setRouteCoordinates([])
    setSelectedMarker(null)
  }

  const toggleFacilityType = (type: string) => {
    const newVisibleTypes = new Set(visibleTypes)
    if (newVisibleTypes.has(type)) {
      newVisibleTypes.delete(type)
    } else {
      newVisibleTypes.add(type)
    }
    setVisibleTypes(newVisibleTypes)
  }

  const getMarkerColor = (type: string) => {
    return MEDICAL_TYPES[type as keyof typeof MEDICAL_TYPES]?.color || '#007AFF'
  }

  const getMedicalIcon = (type: string) => {
    return MEDICAL_TYPES[type as keyof typeof MEDICAL_TYPES]?.icon || '⚕️'
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
          <Marker 
            coordinate={selectedMarker}
            pinColor="red"
          />
        )}
        
        {/* Medical facility markers */}
        {filteredFacilities.map((facility) => (
          <Marker
            key={facility.id}
            coordinate={{ latitude: facility.latitude, longitude: facility.longitude }}
            title={facility.name}
            description={`${facility.type} • ${facility.distance?.toFixed(1)} km`}
            onPress={() => handleFacilitySelect(facility)}
          >
            <View style={[styles.medicalMarker, { borderColor: getMarkerColor(facility.type) }]}>
              <Text style={styles.markerText}>{getMedicalIcon(facility.type)}</Text>
            </View>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
            strokeWidth={5}
            lineDashPattern={routeCoordinates.length === 2 ? [10, 5] : undefined}
          />
        )}
      </MapView>

      {/* Search interface */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={searchMedicalFacilities}
          placeholder="Search medical facilities..."
          style={styles.textInput}
        />
        
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.listView}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => handleFacilitySelect(item)} 
                style={styles.resultItem}
              >
                <View style={styles.resultContent}>
                  <Text style={styles.facilityIcon}>{getMedicalIcon(item.type)}</Text>
                  <View style={styles.facilityInfo}>
                    <Text numberOfLines={1} style={styles.facilityName}>{item.name}</Text>
                    <Text numberOfLines={1} style={styles.facilityDetails}>
                      {MEDICAL_TYPES[item.type as keyof typeof MEDICAL_TYPES]?.label || item.type} • {item.distance?.toFixed(1)} km
                    </Text>
                    <Text numberOfLines={1} style={styles.facilityAddress}>{item.address}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controlsWrap}>
        {/* Zoom to location button */}
        <TouchableOpacity style={styles.locationButton} onPress={zoomToUserLocation}>
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>

        {/* Map key toggle button */}
        <TouchableOpacity 
          style={styles.mapKeyButton} 
          onPress={() => setShowMapKey(!showMapKey)}
        >
          <Text style={styles.mapKeyButtonText}>🗝️</Text>
        </TouchableOpacity>

        {/* Clear route button */}
        {routeCoordinates.length > 0 && (
          <TouchableOpacity style={styles.clearRouteButton} onPress={clearRoute}>
            <Text style={styles.clearRouteText}>Clear Route</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map Key */}
      {showMapKey && (
        <View style={styles.mapKey}>
          <View style={styles.mapKeyHeader}>
            <Text style={styles.mapKeyTitle}>Medical Facilities</Text>
            <TouchableOpacity onPress={() => setShowMapKey(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {Object.entries(MEDICAL_TYPES).map(([type, config]) => (
            <TouchableOpacity
              key={type}
              style={styles.mapKeyItem}
              onPress={() => toggleFacilityType(type)}
            >
              <View style={[styles.keyMarker, { borderColor: config.color }]}>
                <Text style={styles.keyMarkerText}>{config.icon}</Text>
              </View>
              <Text style={[
                styles.keyLabel,
                !visibleTypes.has(type) && styles.keyLabelDisabled
              ]}>
                {config.label}
              </Text>
              <Text style={styles.facilityCount}>
                ({medicalFacilities.filter(f => f.type === type).length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerText: {
    fontSize: 14,
  },
  controlsWrap: {
    position: 'absolute',
    right: 16,
    bottom: Platform.select({ ios: 100, android: 80 }),
    alignItems: 'flex-end',
  },
  locationButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  mapKeyButton: {
    backgroundColor: '#34C759',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapKeyButtonText: {
    fontSize: 18,
  },
  clearRouteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearRouteText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  mapKey: {
    position: 'absolute',
    left: 16,
    bottom: Platform.select({ ios: 100, android: 80 }),
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  mapKeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapKeyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  mapKeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  keyMarker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 8,
  },
  keyMarkerText: {
    fontSize: 12,
  },
  keyLabel: {
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  keyLabelDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  facilityCount: {
    fontSize: 12,
    color: '#666',
  },
})