import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

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

            const categoriasAgrupadas = todasTransacoes.reduce((acumulador, item) => {
              const cat = item.categoria || 'Outros'; 
              
              if (!acumulador[cat]) {
                acumulador[cat] = 0;
              }
              acumulador[cat] += item.valor;
              return acumulador;
            }, {});

            let total = 0;
            const dadosFormatados = Object.keys(categoriasAgrupadas).map((chave) => {
              total += categoriasAgrupadas[chave];
              return {
                name: chave,
                valor: categoriasAgrupadas[chave],
                color: CORES_CATEGORIAS[chave] || CORES_CATEGORIAS['Outros'],
              };
            });

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

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => colors.primary, 
    labelColor: (opacity = 1) => colors.text,
    barPercentage: 0.8,
    fillShadowGradientOpacity: 1,
  };

  // Preparação com compressão matemática
  const barChartData = {
    labels: dadosGrafico.map(() => ''), 
    datasets: [
      {
        // MODIFICAÇÃO CRÍTICA: Aplicamos Math.sqrt para achatar a diferença visual das barras
        data: dadosGrafico.map(item => Math.sqrt(item.valor)),
        colors: dadosGrafico.map(item => () => item.color) 
      }
    ]
  };

  // Função para reverter a compressão exclusivamente no texto do eixo lateral
  function formatarEixoY(valorY) {
    const num = parseFloat(valorY);
    
    // Elevamos ao quadrado para descobrir e exibir o valor real original
    const valorReal = Math.pow(num, 2);
    
    if (valorReal >= 1000) {
      return (valorReal / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return Math.round(valorReal).toString();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.titulo, { color: colors.text }]}>Gastos por Categoria</Text>
      
      {dadosGrafico.length === 0 ? (
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 40 }}>
          Ainda não existem dados suficientes para gerar o relatório.
        </Text>
      ) : (
        <View style={[styles.cartaoGrafico, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BarChart
            data={barChartData}
            width={screenWidth - 50} 
            height={240}
            yAxisLabel="R$ "
            chartConfig={chartConfig}
            fromZero={true}
            showValuesOnTopOfBars={false} 
            withCustomBarColorFromData={true} 
            flatColor={true} 
            formatYLabel={formatarEixoY} // Renderiza os números corrigidos (Ex: 10k, 2.5k, 500)
            style={{
              paddingRight: 0,
              paddingTop: 16,
            }}
          />
        </View>
      )}

      {/* A lista detalhada permanece intacta e com os valores reais perfeitos */}
      <View style={styles.resumoContainer}>
        <Text style={[styles.subtitulo, { color: colors.text }]}>Detalhes e Legenda</Text>
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
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  cartaoGrafico: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resumoContainer: { marginBottom: 20 },
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