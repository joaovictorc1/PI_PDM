import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { metasApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function Metas() {
  const { colors } = useTheme();
  const [listaMetas, setListaMetas] = useState([]);
  const [carregando, setCarregando] = useState(false); 
  const [erro, setErro] = useState(null);              

const carregarMetas = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await metasApi.listar();
      setListaMetas(dados);
    } catch (error) {
      console.error('Erro ao carregar metas', error);
      setErro('Não foi possível ligar ao servidor.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarMetas();
    }, [carregarMetas])
  );

async function apagarMeta(id) {
    try {
      await metasApi.eliminar(id); 
      
      const novaLista = listaMetas.filter(meta => meta.id !== id);
      setListaMetas(novaLista);
    } catch (error) {
      console.error('Erro ao apagar meta:', error);
      Alert.alert('Erro', 'Não foi possível apagar a meta no servidor.');
    }
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Text style={styles.textoErro}>{erro}</Text>
        <Pressable onPress={carregarDados} style={[styles.botaoRetry, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.primary }}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
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