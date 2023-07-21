import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/pages/HomePage';
import DetectScreen from './src/pages/DetectPage';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Detect" component={DetectScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}