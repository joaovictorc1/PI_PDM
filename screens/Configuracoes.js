import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Configuracoes() {
  const { colors } = useTheme();

  async function exportarBackup() {
    try {
      const transacoes = await AsyncStorage.getItem('@transacoes_wisecash');
      const metas = await AsyncStorage.getItem('@metas_wisecash');

      const backupData = {
        dataExportacao: new Date().toISOString(),
        transacoes: transacoes ? JSON.parse(transacoes) : [],
        metas: metas ? JSON.parse(metas) : []
      };

      const conteudoString = JSON.stringify(backupData, null, 2);
      const caminhoFicheiro = FileSystem.documentDirectory + 'wisecash_backup.json';
      
      await FileSystem.writeAsStringAsync(caminhoFicheiro, conteudoString);

      const podePartilhar = await Sharing.isAvailableAsync();
      
      if (podePartilhar) {
        await Sharing.shareAsync(caminhoFicheiro, {
          mimeType: 'application/json', 
          dialogTitle: 'Exportar Backup do Wisecash', 
          UTI: 'public.json' 
        });
      } else {
        Alert.alert('Erro', 'A partilha de ficheiros não é suportada neste dispositivo.');
      }

    } catch (error) {
      console.error('Erro no backup:', error);
      Alert.alert('Erro', 'Não foi possível gerar o ficheiro de backup.');
    }
  }

  function confirmarLimpeza() {
    Alert.alert(
      'Apagar Todos os Dados',
      'Tem a certeza absoluta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Apagar Tudo', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Sucesso', 'A aplicação foi restaurada para o estado inicial. Reinicie o Wisecash.');
            } catch (error) {
              console.error('Erro ao limpar dados:', error);
              Alert.alert('Erro', 'Não foi possível apagar os dados.');
            }
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.titulo, { color: colors.text }]}>Gestão de Dados</Text>
      
      <Text style={{ color: 'gray', marginBottom: 20 }}>
        Mantenha os seus dados financeiros seguros exportando um ficheiro de backup.
      </Text>

      <Pressable 
        style={({ pressed }) => [styles.botaoAcao, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
        onPress={exportarBackup}
      >
        <View style={styles.iconeContainer}>
          <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.textosBotao}>
          <Text style={[styles.tituloBotao, { color: colors.text }]}>Exportar Backup</Text>
          <Text style={styles.subtituloBotao}>Guardar ficheiro JSON</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </Pressable>
      
      <Text style={[styles.titulo, { color: colors.text, marginTop: 40, fontSize: 18 }]}>Zona de Perigo</Text>
      
      <Pressable 
        style={({ pressed }) => [styles.botaoAcao, { backgroundColor: '#3A1C1C', borderColor: '#FF4C4C' }, pressed && { opacity: 0.7 }]}
        onPress={confirmarLimpeza}
      >
        <View style={styles.iconeContainer}>
          <Ionicons name="warning-outline" size={24} color="#FF4C4C" />
        </View>
        <View style={styles.textosBotao}>
          <Text style={[styles.tituloBotao, { color: '#FFFFFF' }]}>Apagar Todos os Dados</Text>
          <Text style={[styles.subtituloBotao, { color: '#FF9999' }]}>Ação irreversível</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  botaoAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconeContainer: { marginRight: 16 },
  textosBotao: { flex: 1 },
  tituloBotao: { fontSize: 16, fontWeight: 'bold' },
  subtituloBotao: { fontSize: 14, color: 'gray', marginTop: 2 }
});