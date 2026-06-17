import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function Perfil() {
  const { colors } = useTheme();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [ocupacao, setOcupacao] = useState('');
  const [foto, setFoto] = useState(null);

  // Carrega os dados do perfil assim que a tela abre
  useEffect(() => {
    async function carregarPerfil() {
      try {
        const dados = await AsyncStorage.getItem('@perfil_wisecash');
        if (dados) {
          const perfil = JSON.parse(dados);
          setNome(perfil.nome || '');
          setEmail(perfil.email || '');
          setOcupacao(perfil.ocupacao || '');
          setFoto(perfil.foto || null);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil', error);
      }
    }
    carregarPerfil();
  }, []);

  // --- FUNÇÃO GATILHO DO EASTER EGG ATUALIZADA ---
  function aoMudarNome(texto) {
    setNome(texto);

    if (texto === '119201512615') {
      setNome('Astolfo');
      setEmail('Leozinho@Astolfo.com');
      setOcupacao('Espadachim');
      
      try {
        // Como o ficheiro Perfil.js está dentro da pasta 'screens', 
        // usamos '../assets/avatar.png' para subir um nível e encontrar a pasta assets.
        const caminhoImagemLocal = Image.resolveAssetSource(require('../assets/Astolfo (Espada).png')).uri;
        setFoto(caminhoImagemLocal);
      } catch (error) {
        console.warn('Aviso: Certifique-se de que o ficheiro assets/avatar.png existe no projeto.');
      }
      
      Alert.alert(
        '🔓 Perfil Secreto Carregado',
        'Os dados locais do administrador foram injetados com sucesso. Não se esqueça de guardar as alterações!'
      );
    }
  }

  // Função para escolher a foto da galeria
  async function escolherFoto() {
    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!resultado.canceled) {
      setFoto(resultado.assets[0].uri);
    }
  }

  // Guarda todas as informações no armazenamento local
  async function guardarPerfil() {
    try {
      const perfil = { nome, email, ocupacao, foto };
      await AsyncStorage.setItem('@perfil_wisecash', JSON.stringify(perfil));
      Alert.alert('Sucesso', 'O seu perfil foi atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar o perfil.');
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      
      {/* Área da Foto de Perfil */}
      <View style={styles.cabecalhoFoto}>
        <Pressable onPress={escolherFoto} style={styles.fotoContainer}>
          {foto ? (
            <Image source={{ uri: foto }} style={styles.foto} />
          ) : (
            <View style={[styles.fotoPlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="person" size={60} color="gray" />
            </View>
          )}
          
          <View style={[styles.iconeEditarFoto, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text style={[styles.textoAjuda, { color: 'gray' }]}>Toque na imagem para alterar</Text>
      </View>

      {/* Formulário de Informações */}
      <View style={[styles.cartao, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Nome Completo</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: João Silva"
            placeholderTextColor="gray"
            value={nome}
            onChangeText={aoMudarNome}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: joao@email.com"
            placeholderTextColor="gray"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Ocupação / Profissão</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Desenvolvedor, Estudante..."
            placeholderTextColor="gray"
            value={ocupacao}
            onChangeText={setOcupacao}
          />
        </View>

        <Pressable style={[styles.botaoSalvar, { backgroundColor: colors.primary }]} onPress={guardarPerfil}>
          <Text style={styles.textoBotaoSalvar}>Guardar Alterações</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cabecalhoFoto: { alignItems: 'center', marginVertical: 24 },
  fotoContainer: { position: 'relative' },
  foto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#2E8B57' },
  fotoPlaceholder: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#2A2A2A' },
  iconeEditarFoto: { position: 'absolute', bottom: 0, right: 0, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#121212' },
  textoAjuda: { marginTop: 12, fontSize: 14 },
  cartao: { borderRadius: 12, borderWidth: 1, padding: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  botaoSalvar: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  textoBotaoSalvar: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});