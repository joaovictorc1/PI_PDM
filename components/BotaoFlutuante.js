import { StyleSheet, Pressable, View, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useNavigation } from '@react-navigation/native';
import { useState } from 'react';

export default function BotaoFlutuante() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [menuVisivel, setMenuVisivel] = useState(false);

  function acionarOpcao(telaDestino) {
    setMenuVisivel(false);
    navigation.navigate(telaDestino);
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={({ pressed }) => [
          styles.botao, 
          { backgroundColor: colors.primary, borderColor: colors.background }, // Borda com a cor de fundo do app
          pressed && styles.pressionado 
        ]}
        onPress={() => setMenuVisivel(true)}
      >
        <Ionicons name="add" size={32} color={colors.text} />
      </Pressable>

      {/* Pop-up centralizado (Mantém-se igual) */}
      <Modal visible={menuVisivel} transparent={true} animationType="fade" onRequestClose={() => setMenuVisivel(false)}>
        <Pressable style={styles.modalFundo} onPress={() => setMenuVisivel(false)}>
          <View style={[styles.modalCartao, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>O que deseja criar?</Text>

            <Pressable style={[styles.opcaoBotao, { backgroundColor: colors.border }]} onPress={() => acionarOpcao('GerenciarTransacao')}>
              <Ionicons name="cash-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[styles.opcaoTexto, { color: colors.text }]}>Nova Transação</Text>
            </Pressable>

            <Pressable style={[styles.opcaoBotao, { backgroundColor: colors.border }]} onPress={() => acionarOpcao('Orcamentos')}>
              <Ionicons name="wallet-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[styles.opcaoTexto, { color: colors.text }]}>Limite de Orçamento</Text>
            </Pressable>
            
            <Pressable style={[styles.opcaoBotao, { backgroundColor: colors.border }]} onPress={() => acionarOpcao('GerenciarMeta')}>
              <Ionicons name="trophy-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={[styles.opcaoTexto, { color: colors.text }]}>Nova Meta</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // position: 'absolute' foi removido!
    top: -10, // Faz o botão ficar um pouco acima da barra inferior
    justifyContent: 'center',
    alignItems: 'center',
  },
  botao: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 4, // Cria o efeito de "recorte" na barra
  },
  pressionado: { opacity: 0.7 },
  
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCartao: { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  opcaoBotao: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, borderRadius: 8, marginBottom: 12 },
  opcaoTexto: { fontSize: 16, fontWeight: 'bold' }
});