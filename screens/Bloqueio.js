import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function Bloqueio({ aoDesbloquear }) {
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erro, setErro] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [biometriaHabilitada, setBiometriaHabilitada] = useState(false);

  // Assim que a tela carrega, verifica se a biometria está ativada e já a aciona
  useEffect(() => {
    async function checarBiometria() {
      const usarBiometria = await AsyncStorage.getItem('@biometria_wisecash');
      if (usarBiometria === 'true') {
        setBiometriaHabilitada(true);
        autenticarComCelular();
      }
    }
    checarBiometria();
  }, []);

  // Chama a API nativa do aparelho (FaceID, TouchID ou PIN do celular)
  async function autenticarComCelular() {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Wisecash',
      fallbackLabel: 'Usar senha do app',
      disableDeviceFallback: false, // Permite usar a senha/padrão do próprio celular se a biometria falhar
    });

    if (resultado.success) {
      aoDesbloquear();
    }
  }

  // Fallback: A senha customizada do App que criamos antes
  async function verificarSenhaApp() {
    try {
      const senhaSalva = await AsyncStorage.getItem('@senha_wisecash');
      if (senhaDigitada === senhaSalva) {
        setErro(false);
        aoDesbloquear();
      } else {
        setErro(true);
        setSenhaDigitada('');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível verificar a senha.');
    }
  }

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={80} color="#2E8B57" style={styles.icone} />
      <Text style={styles.titulo}>Wisecash Protegido</Text>
      <Text style={styles.subtitulo}>Desbloqueie para acessar seus dados</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, erro && styles.inputErro]}
          value={senhaDigitada}
          onChangeText={(texto) => {
            setSenhaDigitada(texto);
            setErro(false);
          }}
          secureTextEntry={!senhaVisivel}
          placeholder="Senha do aplicativo..."
          placeholderTextColor="#666"
        />
        <Pressable style={styles.iconeOlho} onPress={() => setSenhaVisivel(!senhaVisivel)}>
          <Ionicons name={senhaVisivel ? "eye-off" : "eye"} size={24} color="#666" />
        </Pressable>
      </View>

      {erro && <Text style={styles.textoErro}>Senha incorreta. Tente novamente.</Text>}

      <Pressable style={styles.botao} onPress={verificarSenhaApp}>
        <Text style={styles.textoBotao}>Entrar com Senha do App</Text>
      </Pressable>

      {/* Botão extra para chamar a biometria novamente caso o usuário tenha fechado a janela */}
      {biometriaHabilitada && (
        <Pressable style={styles.botaoBiometria} onPress={autenticarComCelular}>
          <Ionicons name="finger-print" size={24} color="#2E8B57" />
          <Text style={styles.textoBiometria}>Usar Biometria do Celular</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 24 },
  icone: { marginBottom: 20 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitulo: { fontSize: 16, color: 'gray', marginBottom: 32 },
  inputContainer: { width: '100%', position: 'relative', justifyContent: 'center', marginBottom: 16 },
  input: { width: '100%', height: 50, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 48, color: '#FFFFFF', fontSize: 18, textAlign: 'center' },
  inputErro: { borderColor: '#FF4C4C' },
  iconeOlho: { position: 'absolute', right: 16, height: '100%', justifyContent: 'center', zIndex: 1 },
  textoErro: { color: '#FF4C4C', marginBottom: 16 },
  botao: { width: '100%', height: 50, backgroundColor: '#2E8B57', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  textoBotao: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  botaoBiometria: { flexDirection: 'row', alignItems: 'center', marginTop: 32, padding: 12 },
  textoBiometria: { color: '#2E8B57', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});