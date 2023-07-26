import { createStackNavigator } from '@react-navigation/stack';
import HomePage from './src/pages/HomePage';

const Stack = createStackNavigator();

export default function App() {
  return (
    <HomePage />
  );
}
