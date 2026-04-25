import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

export default function BarraProgresso({ gastoTotal, limiteOrcamento }) {
  const { colors } = useTheme();

  // Proteção matemática para evitar divisão por zero
  const limite = limiteOrcamento > 0 ? limiteOrcamento : 1; 
  let percentagem = (gastoTotal / limite) * 100;
  
  // Limita a barra visual a 100% para não quebrar o layout
  const larguraBarra = percentagem > 100 ? 100 : percentagem;

  // Lógica de cores baseada no consumo do orçamento
  let corDaBarra = colors.primary; // Verde por defeito
  if (percentagem >= 80 && percentagem < 100) {
    corDaBarra = '#FFD700'; // Amarelo/Dourado (Aviso)
  } else if (percentagem >= 100) {
    corDaBarra = '#FF4C4C'; // Vermelho (Ultrapassado)
  }

  return (
    <View style={[styles.cartao, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cabecalho}>
        <Text style={[styles.titulo, { color: colors.text }]}>Orçamento do Mês</Text>
        <Text style={[styles.percentagem, { color: corDaBarra }]}>
          {percentagem.toFixed(0)}%
        </Text>
      </View>

      <View style={[styles.trilha, { backgroundColor: colors.border }]}>
        {/* A barra de progresso que cresce dinamicamente */}
        <View 
          style={[
            styles.preenchimento, 
            { width: `${larguraBarra}%`, backgroundColor: corDaBarra }
          ]} 
        />
      </View>

      <View style={styles.rodape}>
        <Text style={{ color: 'gray', fontSize: 14 }}>
          Gasto: R$ {gastoTotal.toFixed(2)}
        </Text>
        <Text style={{ color: 'gray', fontSize: 14 }}>
          Limite: R$ {limiteOrcamento.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 20,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentagem: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trilha: {
    height: 12,
    borderRadius: 6,
    width: '100%',
    overflow: 'hidden', // Garante que o preenchimento não saia dos cantos arredondados
  },
  preenchimento: {
    height: '100%',
    borderRadius: 6,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  }
});