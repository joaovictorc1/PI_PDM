import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';

import { transacoesApi } from '../services/api'; 
import DespesaItem    from '../components/despesa/DespesaItem';
import DespesaSumario from '../components/despesa/DespesaSumario';

export default function Transacoes() {
  const { colors }    = useTheme();
  const [listaTransacoes, setListaTransacoes] = useState([]);
  const [filtro,    setFiltro]    = useState('todas');
  const [carregando, setCarregando] = useState(false); 
  const [erro,      setErro]      = useState(null);   

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const todasTransacoes = await transacoesApi.listar(filtro);
      const transacoesAgrupadas = [];
      const mapasGrupos = {};

      todasTransacoes.forEach(item => {
        if (item.grupoId) {
          if (!mapasGrupos[item.grupoId]) {
            mapasGrupos[item.grupoId] = {
              isGrupo:            true,
              id:                 item.grupoId,
              descricaoBase:      item.descricaoBase,
              valor:              item.valorTotalDaCompra,
              valorTotalDaCompra: item.valorTotalDaCompra,
              data:               item.data,
              categoria:          item.categoria,
              tags:               item.tags,
              parcelas:           [],
            };
            transacoesAgrupadas.push(mapasGrupos[item.grupoId]);
          }
          mapasGrupos[item.grupoId].parcelas.push(item);
        } else {
          transacoesAgrupadas.push(item);
        }
      });

      transacoesAgrupadas.forEach(item => {
        if (item.isGrupo) {
          item.parcelas.sort((a, b) => new Date(a.data) - new Date(b.data));
          item.data = item.parcelas[0].data;
        }
      });

      transacoesAgrupadas.sort((a, b) => new Date(b.data) - new Date(a.data));
      setListaTransacoes(transacoesAgrupadas);

    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setErro('Não foi possível ligar ao servidor.'); 
    } finally {
      setCarregando(false); 
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => { carregarDados(); }, [carregarDados])
  );

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
  // ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={[styles.filtroContainer, { borderColor: colors.border }]}>
        <Pressable
          style={[styles.botaoFiltro, filtro === 'todas' && { backgroundColor: colors.primary }]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.textoFiltro, { color: filtro === 'todas' ? '#FFFFFF' : colors.text }]}>
            Todas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.botaoFiltro, filtro === 'recentes' && { backgroundColor: colors.primary }]}
          onPress={() => setFiltro('recentes')}
        >
          <Text style={[styles.textoFiltro, { color: filtro === 'recentes' ? '#FFFFFF' : colors.text }]}>
            Últimos 7 dias
          </Text>
        </Pressable>
      </View>

      <DespesaSumario despesas={listaTransacoes} />

      <FlatList
        data={listaTransacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DespesaItem {...item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.textoVazio}>Nenhuma transação encontrada.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 16 },
  centrado:         { justifyContent: 'center', alignItems: 'center' },
  filtroContainer:  { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  botaoFiltro:      { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1E1E1E' },
  textoFiltro:      { fontSize: 14, fontWeight: 'bold' },
  textoVazio:       { color: 'gray', textAlign: 'center', marginTop: 40, fontSize: 16 },
  textoErro:        { color: '#FF4C4C', textAlign: 'center', marginBottom: 16 },
  botaoRetry:       { borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
});