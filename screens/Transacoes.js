import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DespesaItem from '../components/despesa/DespesaItem';
import DespesaSumario from '../components/despesa/DespesaSumario';

export default function Transacoes() {
  const { colors } = useTheme();
  const [listaTransacoes, setListaTransacoes] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // Estados: 'todas' ou 'recentes'

  const carregarDados = useCallback(async () => {
    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      if (dadosGuardados) {
        const todasTransacoes = JSON.parse(dadosGuardados);

        // 1. APLICAR FILTRO DE TEMPO (Se selecionado as recentes)
        let transacoesFiltradas = todasTransacoes;
        if (filtro === 'recentes') {
          const hoje = new Date();
          const seteDiasAtras = new Date(hoje);
          seteDiasAtras.setDate(hoje.getDate() - 7);

          transacoesFiltradas = todasTransacoes.filter(item => {
            const dataItem = new Date(item.data);
            return dataItem >= seteDiasAtras && dataItem <= hoje;
          });
        }

        // 2. AGRUPAMENTO VISUAL (Evita repetição de parcelas na listagem)
        const transacoesAgrupadas = [];
        const mapasGrupos = {};

        transacoesFiltradas.forEach(item => {
          if (item.grupoId) {
            if (!mapasGrupos[item.grupoId]) {
              mapasGrupos[item.grupoId] = {
                isGrupo: true,
                id: item.grupoId,
                descricaoBase: item.descricaoBase,
                // Mantém a propriedade 'valor' legível para o componente de Sumário não retornar NaN
                valor: item.valorTotalDaCompra, 
                valorTotalDaCompra: item.valorTotalDaCompra,
                data: item.data, 
                categoria: item.categoria,
                tags: item.tags,
                parcelas: []
              };
              transacoesAgrupadas.push(mapasGrupos[item.grupoId]);
            }
            mapasGrupos[item.grupoId].parcelas.push(item);
          } else {
            transacoesAgrupadas.push(item);
          }
        });

        // Ordenar parcelas internas e ajustar a data base do grupo
        transacoesAgrupadas.forEach(item => {
          if (item.isGrupo) {
            item.parcelas.sort((a, b) => new Date(a.data) - new Date(b.data));
            item.data = item.parcelas[0].data;
          }
        });

        // Ordenar histórico geral por data (mais recente primeiro)
        transacoesAgrupadas.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        setListaTransacoes(transacoesAgrupadas);
      } else {
        setListaTransacoes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar transações', error);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  return (
    <View style={styles.container}>
      {/* Seletor de Filtro Superior Avançado */}
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
            Recentes
          </Text>
        </Pressable>
      </View>

      {/* O Sumário calcula automaticamente com base no array injetado */}
      <DespesaSumario despesas={listaTransacoes} />

      <FlatList
        data={listaTransacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DespesaItem {...item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.textoVazio}>Nenhuma transação encontrada.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filtroContainer: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    borderRadius: 8, 
    overflow: 'hidden', 
    borderWidth: 1 
  },
  botaoFiltro: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    backgroundColor: '#1E1E1E' 
  },
  textoFiltro: { 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  textoVazio: { 
    color: 'gray', 
    textAlign: 'center', 
    marginTop: 40, 
    fontSize: 16 
  }
});