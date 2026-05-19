import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppNavigator />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
