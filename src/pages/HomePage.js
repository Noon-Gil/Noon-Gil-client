// HomeScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomePage({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Object Detection"
        onPress={() => navigation.navigate('Detect')}
      />
    </View>
  );
}
