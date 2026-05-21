import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { FavoritosProvider } from './src/contexts/FavoritosContext';
import { CarritoProvider } from './src/contexts/CarritoContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <FavoritosProvider>
              <CarritoProvider>
                <AppNavigator />
              </CarritoProvider>
            </FavoritosProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
