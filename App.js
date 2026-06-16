import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importação das telas e componentes
import Dashboard from './screens/Dashboard';
import Transacoes from './screens/Transacoes';
import GerenciarTransacao from './screens/GerenciarTransacao';
import Relatorios from './screens/Relatorios';
import Metas from './screens/Metas';
import GerenciarMeta from './screens/GerenciarMeta';
import Configuracoes from './screens/Configuracoes';
import Orcamentos from './screens/Orcamentos'; 
import Perfil from './screens/Perfil';
import Bloqueio from './screens/Bloqueio';
import BotaoFlutuante from './components/BotaoFlutuante';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TemaEscuroVerde = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#2E8B57',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#2A2A2A',
  },
};

function NavegacaoPrincipal() {
  return (
    <Tab.Navigator
      // Repare que adicionei o "navigation" aqui nos parâmetros globais
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          else if (route.name === 'Transações') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Relatórios') iconName = focused ? 'bar-chart' : 'bar-chart-outline'; 
          else if (route.name === 'Metas') iconName = focused ? 'trophy' : 'trophy-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerTitleAlign: 'center',
        
        // --- A MÁGICA ESTÁ AQUI: O botão agora é global para todas as abas ---
        headerRight: () => (
          <Ionicons 
            name="settings-outline" 
            size={24} 
            color="#2E8B57" 
            style={{ marginRight: 16 }} 
            onPress={() => navigation.navigate('Configuracoes')} 
          />
        ),
        // ---------------------------------------------------------------------

        tabBarStyle: { 
          borderTopWidth: 0, 
          elevation: 0, 
          shadowOpacity: 0,
          backgroundColor: '#1E1E1E', 
          height: 70 
        },
        tabBarShowLabel: false 
      })}
    >
      {/* O Dashboard agora ficou muito mais limpo, só com o título */}
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Visão Geral' }} />
      <Tab.Screen name="Transações" component={Transacoes} options={{ title: 'Transações' }} />

      <Tab.Screen 
        name="Adicionar" 
        component={View} 
        options={{
          tabBarButton: () => <BotaoFlutuante /> 
        }} 
      />

      <Tab.Screen name="Relatórios" component={Relatorios} options={{ title: 'Relatórios' }} />
      <Tab.Screen name="Metas" component={Metas} options={{ title: 'Metas' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [statusAcesso, setStatusAcesso] = useState('carregando');

  useEffect(() => {
    async function checarProtecao() {
      try {
        const senha = await AsyncStorage.getItem('@senha_wisecash');
        if (senha) setStatusAcesso('bloqueado');
        else setStatusAcesso('livre');
      } catch (e) { setStatusAcesso('livre'); }
    }
    checarProtecao();
  }, []);

  if (statusAcesso === 'carregando') return null; 

  if (statusAcesso === 'bloqueado') {
    return (
      <>
        <StatusBar style="light" />
        <Bloqueio aoDesbloquear={() => setStatusAcesso('livre')} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={TemaEscuroVerde}>
        <Stack.Navigator>
          <Stack.Screen name="Principal" component={NavegacaoPrincipal} options={{ headerShown: false }} />
          <Stack.Screen name="GerenciarTransacao" component={GerenciarTransacao} options={{ title: 'Nova Transação', presentation: 'modal' }} />
          <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ title: 'Configurações' }} />
          <Stack.Screen name="Perfil" component={Perfil} options={{ title: 'Meu Perfil' }} />
          <Stack.Screen name="Orcamentos" component={Orcamentos} options={{ title: 'Definir Limites' }} />
          <Stack.Screen name="GerenciarMeta" component={GerenciarMeta} options={{ title: 'Planejar Nova Meta' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}