import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Importação das telas
import Dashboard from './screens/Dashboard';
import Transacoes from './screens/Transacoes';
import GerenciarTransacao from './screens/GerenciarTransacao';
import DespesasRecentes from './screens/DespesasRecentes'
import Relatorios from './screens/Relatorios';
import Metas from './screens/Metas';
import Configuracoes from './screens/Configuracoes';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Nosso tema customizado
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

// Separamos a navegação de abas em um componente próprio
// Separamos a navegação de abas em um componente próprio
function NavegacaoPrincipal() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Recentes') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Transações') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Relatórios') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline'; 
          } else if (route.name === 'Metas') { // A nova aba
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
          // Adiciona o botão de engrenagem no lado direito do cabeçalho
          headerRight: () => (
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color="#2E8B57" // Verde principal do app
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('Configuracoes')} // Navega para a nova tela
            />
          )
        })} 
      />
      <Tab.Screen name="Recentes" component={DespesasRecentes} options={{ title: 'Recentes' }} />
      <Tab.Screen name="Transações" component={Transacoes} options={{ title: 'Todas' }} />
      {/* A nova aba de relatórios */}
      <Tab.Screen name="Relatórios" component={Relatorios} options={{ title: 'Relatórios' }} />
      {/* A nova aba das Metas */}
      <Tab.Screen name="Metas" component={Metas} options={{ title: 'Metas' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={TemaEscuroVerde}>
        {/* A Stack é a base real do App agora */}
        <Stack.Navigator>
          <Stack.Screen name="Principal" component={NavegacaoPrincipal} options={{ headerShown: false }} />
          
          <Stack.Screen name="GerenciarTransacao" component={GerenciarTransacao} options={{ title: 'Nova Transação', presentation: 'modal' }} />
          
          {/* O novo ecrã de configurações na pilha nativa */}
          <Stack.Screen name="Configuracoes" component={Configuracoes} options={{ title: 'Configurações' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}