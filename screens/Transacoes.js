import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DespesaItem from '../components/despesa/DespesaItem';
import DespesaSumario from '../components/despesa/DespesaSumario';
import BotaoFlutuante from '../components/BotaoFlutuante'; // <-- Importação adicionada

export default function Transacoes() {
  const { colors } = useTheme();
  const navigation = useNavigation(); // <-- Declaração da navegação para o botão
  const [listaTransacoes, setListaTransacoes] = useState([]);
  const [filtro, setFiltro] = useState('todas'); 

  const carregarDados = useCallback(async () => {
    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      if (dadosGuardados) {
        const todasTransacoes = JSON.parse(dadosGuardados);

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

        const transacoesAgrupadas = [];
        const mapasGrupos = {};

        transacoesFiltradas.forEach(item => {
          if (item.grupoId) {
            if (!mapasGrupos[item.grupoId]) {
              mapasGrupos[item.grupoId] = {
                isGrupo: true,
                id: item.grupoId,
                descricaoBase: item.descricaoBase,
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

        transacoesAgrupadas.forEach(item => {
          if (item.isGrupo) {
            item.parcelas.sort((a, b) => new Date(a.data) - new Date(b.data));
            item.data = item.parcelas[0].data;
          }
        });

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
      <View style={[styles.filtroContainer, { borderColor: colors.border }]}>
        <Pressable style={[styles.botaoFiltro, filtro === 'todas' && { backgroundColor: colors.primary }]} onPress={() => setFiltro('todas')}>
          <Text style={[styles.textoFiltro, { color: filtro === 'todas' ? '#FFFFFF' : colors.text }]}>Todas</Text>
        </Pressable>
        <Pressable style={[styles.botaoFiltro, filtro === 'recentes' && { backgroundColor: colors.primary }]} onPress={() => setFiltro('recentes')}>
          <Text style={[styles.textoFiltro, { color: filtro === 'recentes' ? '#FFFFFF' : colors.text }]}>Últimos 7 dias</Text>
        </Pressable>
      </View>

      <DespesaSumario despesas={listaTransacoes} />

      <FlatList
        data={listaTransacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DespesaItem {...item} />}
        showsVerticalScrollIndicator={false}
        // Aumento do espaçamento no fundo da lista para acomodar o botão flutuante
        contentContainerStyle={{ paddingBottom: 100 }} 
        ListEmptyComponent={<Text style={styles.textoVazio}>Nenhuma transação encontrada.</Text>}
      />

      {/* Botão Flutuante adicionado ao ecrã de Transações */}
      <BotaoFlutuante onPress={() => navigation.navigate('GerenciarTransacao')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filtroContainer: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  botaoFiltro: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#1E1E1E' },
  textoFiltro: { fontSize: 14, fontWeight: 'bold' },
  textoVazio: { color: 'gray', textAlign: 'center', marginTop: 40, fontSize: 16 }
});