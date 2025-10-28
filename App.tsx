import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './src/navigation/MainNavigator';
import { 
  useFonts, 
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import { GochiHand_400Regular } from '@expo-google-fonts/gochi-hand';
import { NotoSerif_400Regular, NotoSerif_500Medium, NotoSerif_600SemiBold, NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { EBGaramond_400Regular, EBGaramond_500Medium, EBGaramond_600SemiBold, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
const App = () => {
  const [fontsLoaded] = useFonts({
    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    Ebgaramond: EBGaramond_400Regular,
    EbgaramondMedium: EBGaramond_500Medium,
    EbgaramondSemiBold: EBGaramond_600SemiBold,
    EbgaramondBold: EBGaramond_700Bold,
    GochiHand: GochiHand_400Regular,
    NotoSerif: NotoSerif_400Regular,
    NotoSerifMedium: NotoSerif_500Medium,
    NotoSerifSemiBold: NotoSerif_600SemiBold,
    NotoSerifBold: NotoSerif_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4c669f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
};

export default App;