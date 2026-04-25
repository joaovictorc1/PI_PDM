import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

export default function BotaoFlutuante({ onPress }) {
  const { colors } = useTheme(); // Puxa as cores do nosso TemaEscuroVerde

  return (
    <View style={styles.container}>
      <Pressable 
        // O Pressable permite mudar o estilo quando está sendo pressionado
        style={({ pressed }) => [
          styles.botao, 
          { backgroundColor: colors.primary }, // Verde do tema
          pressed && styles.pressionado // Efeito visual de clique
        ]}
        onPress={onPress}
      >
        {/* Ícone de "+" usando a cor do texto do tema (Branco) */}
        <Ionicons name="add" size={32} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // position: 'absolute' é o segredo para fazer o botão flutuar sobre os outros elementos
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  botao: {
    width: 60,
    height: 60,
    borderRadius: 30, // Metade da largura/altura deixa o botão perfeitamente redondo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Cria a sombra no Android
    shadowColor: '#000', // Configurações de sombra para o iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  pressionado: {
    opacity: 0.7, // Deixa o botão um pouco transparente ao tocar
  }
});