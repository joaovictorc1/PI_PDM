import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importação das telas
import Dashboard from './screens/Dashboard';
import Transacoes from './screens/Transacoes';
import GerenciarTransacao from './screens/GerenciarTransacao';
import Relatorios from './screens/Relatorios';
import Metas from './screens/Metas';
import Configuracoes from './screens/Configuracoes';
import Orcamentos from './screens/Orcamentos';
import Bloqueio from './screens/Bloqueio'; 
import Perfil from './screens/Perfil';

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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Transações') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Orçamentos') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Relatórios') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'; 
          } else if (route.name === 'Metas') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerTitleAlign: 'center',
        tabBarStyle: { borderTopWidth: 0, elevation: 0, shadowOpacity: 0 }
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={({ navigation }) => ({ 
          title: 'Visão Geral',
          headerRight: () => (
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color="#2E8B57" 
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('Configuracoes')} 
            />
          )
        })} 
      />
      <Tab.Screen name="Transações" component={Transacoes} options={{ title: 'Transações' }} />
      <Tab.Screen name="Orçamentos" component={Orcamentos} options={{ title: 'Orçamentos' }} />
      <Tab.Screen name="Relatórios" component={Relatorios} options={{ title: 'Relatórios' }} />
      <Tab.Screen name="Metas" component={Metas} options={{ title: 'Metas' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [statusAcesso, setStatusAcesso] = useState('carregando'); // 'carregando', 'bloqueado', 'livre'

  useEffect(() => {
    async function checarProtecao() {
      try {
        const senha = await AsyncStorage.getItem('@senha_wisecash');
        if (senha) {
          setStatusAcesso('bloqueado');
        } else {
          setStatusAcesso('livre');
        }
      } catch (e) {
        setStatusAcesso('livre'); 
      }
    }
    checarProtecao();
  }, []);

  if (statusAcesso === 'carregando') {
    return null; 
  }

  // A BARREIRA: Se tiver senha, mostra apenas a tela de Bloqueio
  if (statusAcesso === 'bloqueado') {
    return (
      <>
        <StatusBar style="light" />
        <Bloqueio aoDesbloquear={() => setStatusAcesso('livre')} />
      </>
    );
  }

  // O CAMINHO LIVRE: Renderiza o App normal
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={TemaEscuroVerde}>
        <Stack.Navigator>
          <Stack.Screen name="Principal" component={NavegacaoPrincipal} options={{ headerShown: false }} />
          <Stack.Screen name="GerenciarTransacao" component={GerenciarTransacao} options={{ title: 'Nova Transação', presentation: 'modal' }} />
          <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ title: 'Configurações' }} />
          <Stack.Screen name="Perfil" component={Perfil} options={{ title: 'Meu Perfil' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}