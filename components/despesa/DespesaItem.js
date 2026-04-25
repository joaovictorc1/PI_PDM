import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';

export default function DespesaItem({ id, descricao, valor, data, categoria }) { 
  const { colors } = useTheme();
  const navigation = useNavigation(); 

  const dataFormatada = new Date(data).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  function abrirEdicao() {
    navigation.navigate('GerenciarTransacao', {
      transacaoEditada: { id, descricao, valor, data, categoria }
    });
  }

  return (
    <Pressable 
      onPress={abrirEdicao}
      style={({ pressed }) => [
        styles.item, 
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressionado
      ]}
    >
      <View style={styles.infoEsquerda}>
        <Text style={[styles.descricao, { color: colors.text }]}>{descricao}</Text>
        
        <View style={styles.detalhesRow}>
          <Text style={[styles.data, { color: 'gray' }]}>{dataFormatada}</Text>
          
          {categoria && (
            <View style={[styles.badgeCategoria, { backgroundColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: 12 }}>{categoria}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.valorContainer}>
        <Text style={[styles.valor, { color: colors.primary }]}>R$ {valor.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, marginVertical: 8, borderWidth: 1, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  pressionado: { opacity: 0.7 },
  infoEsquerda: { flex: 1, marginRight: 10 },
  descricao: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  detalhesRow: { flexDirection: 'row', alignItems: 'center' },
  data: { fontSize: 14, marginRight: 10 },
 
  badgeCategoria: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  valorContainer: { justifyContent: 'center', alignItems: 'flex-end' },
  valor: { fontSize: 16, fontWeight: 'bold' }
});