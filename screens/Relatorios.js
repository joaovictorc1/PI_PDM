import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';

// Obter a largura do ecrã do telemóvel para o gráfico ocupar o espaço correto
const screenWidth = Dimensions.get('window').width;

// Uma paleta de cores para as diferentes categorias
const CORES_CATEGORIAS = {
  'Alimentação': '#FF6384',
  'Transporte': '#36A2EB',
  'Lazer': '#FFCE56',
  'Saúde': '#4BC0C0',
  'Educação': '#9966FF',
  'Outros': '#C9CBCF'
};

export default function Relatorios() {
  const { colors } = useTheme();
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [totalGasto, setTotalGasto] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function processarDados() {
        try {
          const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
          if (dadosGuardados) {
            const todasTransacoes = JSON.parse(dadosGuardados);

            // 1. Agrupar e somar os valores por categoria
            const categoriasAgrupadas = todasTransacoes.reduce((acumulador, item) => {
              // Verifica se a transação tem categoria (para retrocompatibilidade com testes antigos)
              const cat = item.categoria || 'Outros'; 
              
              if (!acumulador[cat]) {
                acumulador[cat] = 0;
              }
              acumulador[cat] += item.valor;
              return acumulador;
            }, {});

            // 2. Formatar os dados para o formato que a biblioteca react-native-chart-kit exige
            let total = 0;
            const dadosFormatados = Object.keys(categoriasAgrupadas).map((chave) => {
              total += categoriasAgrupadas[chave];
              return {
                name: chave,
                valor: categoriasAgrupadas[chave],
                color: CORES_CATEGORIAS[chave] || CORES_CATEGORIAS['Outros'],
                legendFontColor: colors.text,
                legendFontSize: 14
              };
            });

            // Ordenar do maior gasto para o menor
            dadosFormatados.sort((a, b) => b.valor - a.valor);

            setTotalGasto(total);
            setDadosGrafico(dadosFormatados);
          }
        } catch (error) {
          console.error('Erro ao processar relatórios', error);
        }
      }
      processarDados();
    }, [colors.text])
  );

  // Configurações de estilo base do gráfico
  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.titulo, { color: colors.text }]}>Gastos por Categoria</Text>
      
      {dadosGrafico.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>
          Ainda não existem dados suficientes para gerar o relatório.
        </Text>
      ) : (
        <View style={[styles.cartaoGrafico, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <PieChart
            data={dadosGrafico}
            width={screenWidth - 64} // Largura do ecrã menos as margens
            height={220}
            chartConfig={chartConfig}
            accessor={"valor"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute // Mostra os valores reais em vez de percentagens
          />
        </View>
      )}

      {/* Lista detalhada por baixo do gráfico */}
      <View style={styles.resumoContainer}>
        <Text style={[styles.subtitulo, { color: colors.text }]}>Detalhes</Text>
        {dadosGrafico.map((item, index) => (
          <View key={index} style={[styles.linhaResumo, { borderBottomColor: colors.border }]}>
            <View style={styles.indicadorCategoria}>
              <View style={[styles.bolinhaCor, { backgroundColor: item.color }]} />
              <Text style={{ color: colors.text, fontSize: 16 }}>{item.name}</Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>
              R$ {item.valor.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  cartaoGrafico: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resumoContainer: { marginBottom: 40 },
  subtitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  linhaResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  indicadorCategoria: { flexDirection: 'row', alignItems: 'center' },
  bolinhaCor: { width: 12, height: 12, borderRadius: 6, marginRight: 10 }
});