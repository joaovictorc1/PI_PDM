import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DespesaSumario from '../components/despesa/DespesaSumario';
import DespesaItem from '../components/despesa/DespesaItem'; // 1. Importar o novo componente

export default function Transacoes() {
  const { colors } = useTheme();
  const [listaTransacoes, setListaTransacoes] = useState([]);

  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
          if (dadosGuardados) {
            // Ordena as transações da mais recente para a mais antiga antes de guardar no estado
            const dadosConvertidos = JSON.parse(dadosGuardados);
            dadosConvertidos.sort((a, b) => new Date(b.data) - new Date(a.data));
            setListaTransacoes(dadosConvertidos);
          }
        } catch (error) {
          console.error('Erro a carregar dados', error);
        }
      }
      carregarDados();
    }, [])
  );

  // 2. A função agora apenas passa os dados ('...item') para o nosso componente visual
  function renderizarItem({ item }) {
    return <DespesaItem {...item} />;
  }

  return (
    <View style={styles.container}>
      <DespesaSumario despesas={listaTransacoes} periodo="Total Geral" />

      {listaTransacoes.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>
          Ainda não existem transações registadas.
        </Text>
      ) : (
        <FlatList 
          data={listaTransacoes}
          keyExtractor={(item) => item.id}
          renderItem={renderizarItem}
          showsVerticalScrollIndicator={false} // Esconde a barra de scroll para um visual mais limpo
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