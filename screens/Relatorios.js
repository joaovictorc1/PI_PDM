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
    color: (opacity = 1) => colors.primary, // Cor base
    labelColor: (opacity = 1) => colors.text,
    barPercentage: 0.8,
    fillShadowGradientOpacity: 1,
  };

  // Preparação inteligente dos dados
  const barChartData = {
    // 1ª Modificação: Deixamos as labels em branco para não poluir o eixo X
    labels: dadosGrafico.map(() => ''), 
    datasets: [
      {
        data: dadosGrafico.map(item => item.valor),
        // 2ª Modificação: Injetamos a cor específica de cada categoria na respetiva barra
        colors: dadosGrafico.map(item => () => item.color) 
      }
    ]
  };

  // Função para formatar os valores muito altos (10000 -> 10k)
  function formatarEixoY(valorY) {
    const num = parseFloat(valorY);
    if (num >= 1000) {
      // Divide por 1000, deixa 1 casa decimal e remove o ".0" se for número inteiro (ex: 10.0k -> 10k)
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return Math.round(num).toString();
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
            showValuesOnTopOfBars={false} // Retiramos os números encavalitados do topo
            withCustomBarColorFromData={true} // Dizemos ao gráfico para usar a nossa paleta de cores
            flatColor={true} // Tira o efeito de gradiente/transparência para ficar idêntico à bolinha da legenda
            formatYLabel={formatarEixoY} // Formata para "10k" se passar de mil
            style={{
              paddingRight: 0,
              paddingTop: 16,
            }}
          />
        </View>
      )}

      {/* Lista detalhada por baixo do gráfico */}
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