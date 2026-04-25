import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

// O componente recebe duas propriedades (props):
// 1. despesas: a lista completa de transações
// 2. periodo: um texto descritivo (ex: "Total Geral" ou "Últimos 7 dias")
export default function DespesaSumario({ despesas, periodo }) {
  const { colors } = useTheme();

  // O método reduce percorre o array e soma o 'valor' de cada item
  // O '0' no final é o valor inicial da soma
  const somaTotal = despesas.reduce((soma, despesa) => {
    return soma + despesa.valor;
  }, 0);

  return (
    // Utilizamos a cor 'card' do nosso tema noturno para destacar o fundo
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.periodo, { color: colors.text }]}>{periodo}</Text>
      <Text style={[styles.valor, { color: colors.primary }]}>
        R$ {somaTotal.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row', // Alinha o texto e o valor lado a lado
    justifyContent: 'space-between', // Empurra um para a esquerda e outro para a direita
    alignItems: 'center',
    marginBottom: 16,
    // Efeitos de sombra sutis para destacar o cartão do fundo
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  periodo: {
    fontSize: 14,
  },
  valor: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});