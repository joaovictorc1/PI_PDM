import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DespesaSumario from '../components/despesa/DespesaSumario';
import DespesaItem from '../components/despesa/DespesaItem';

export default function DespesasRecentes() {
  const { colors } = useTheme();
  const [transacoesRecentes, setTransacoesRecentes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
          if (dadosGuardados) {
            const todasTransacoes = JSON.parse(dadosGuardados);

            // Lógica em JavaScript puro para obter a janela de tempo
            const hoje = new Date();
            // Cria uma nova data retrocedendo exatamente 7 dias
            const dataSeteDiasAtras = new Date(
              hoje.getFullYear(),
              hoje.getMonth(),
              hoje.getDate() - 7
            );

            // Filtra o array mantendo apenas o que ocorreu nestes 7 dias
            const recentes = todasTransacoes.filter(item => {
              const dataTransacao = new Date(item.data);
              return dataTransacao >= dataSeteDiasAtras && dataTransacao <= hoje;
            });

            // Ordena da mais recente para a mais antiga
            recentes.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            setTransacoesRecentes(recentes);
          }
        } catch (error) {
          console.error('Erro a carregar dados recentes', error);
        }
      }
      carregarDados();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Reutilizamos o sumário, mas agora a soma reflete apenas a última semana */}
      <DespesaSumario despesas={transacoesRecentes} periodo="Últimos 7 Dias" />

      {transacoesRecentes.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>
          Não há transações registadas na última semana.
        </Text>
      ) : (
        <FlatList 
          data={transacoesRecentes}
          keyExtractor={(item) => item.id}
          // Reutilizamos o mesmo componente de interface para desenhar a lista
          renderItem={({ item }) => <DespesaItem {...item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16,
  }
});