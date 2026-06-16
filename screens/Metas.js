import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Metas() {
  const { colors } = useTheme();
  const [listaMetas, setListaMetas] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function carregarMetas() {
        try {
          const dados = await AsyncStorage.getItem('@metas_wisecash');
          if (dados) setListaMetas(JSON.parse(dados));
        } catch (error) {
          console.error('Erro ao carregar metas', error);
        }
      }
      carregarMetas();
    }, [])
  );

  async function apagarMeta(id) {
    try {
      const novaLista = listaMetas.filter(meta => meta.id !== id);
      await AsyncStorage.setItem('@metas_wisecash', JSON.stringify(novaLista));
      setListaMetas(novaLista);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível apagar a meta.');
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.titulo, { color: colors.text }]}>As Minhas Metas</Text>
      
      {listaMetas.length === 0 ? (
        <Text style={{ color: 'gray', textAlign: 'center', marginTop: 40 }}>
          Ainda não guardou nenhuma meta. Toque no botão "+" da barra inferior para criar uma!
        </Text>
      ) : (
        <View style={{ paddingBottom: 40 }}>
          {listaMetas.map((meta) => (
            <View key={meta.id} style={[styles.cartaoMetaGuardada, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{meta.nome}</Text>
                <Text style={{ color: 'gray', fontSize: 14, marginTop: 4 }}>
                  Alvo: R$ {meta.valorAlvo.toFixed(2)} | Aporte: R$ {meta.depositoMensal.toFixed(2)}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 14, marginTop: 8, fontWeight: 'bold' }}>
                  <Ionicons name="calendar-outline" size={14} /> Conclusão em {meta.previsaoData}
                </Text>
              </View>
              
              <Pressable onPress={() => apagarMeta(meta.id)} style={styles.botaoApagar}>
                <Ionicons name="trash-outline" size={24} color="#FF4C4C" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  cartaoMetaGuardada: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  botaoApagar: { padding: 8 }
});