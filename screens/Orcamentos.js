import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIAS_DISPONIVEIS = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

export default function Orcamentos() {
  const { colors } = useTheme();

  // Estados para armazenar os dados
  const [limites, setLimites] = useState({}); // Ex: { 'Lazer': 500, 'Alimentação': 1000 }
  const [gastosAtuais, setGastosAtuais] = useState({}); // Ex: { 'Lazer': 450, 'Alimentação': 200 }

  // Estados do Modal de Edição
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [valorInput, setValorInput] = useState('');

  // Carrega os gastos do mês e os limites guardados
  useFocusEffect(
    useCallback(() => {
      async function carregarDados() {
        try {
          // 1. Carregar Limites
          const limitesGuardados = await AsyncStorage.getItem('@orcamentos_wisecash');
          if (limitesGuardados) {
            setLimites(JSON.parse(limitesGuardados));
          }

          // 2. Carregar Despesas e calcular apenas as do mês atual
          const transacoesGuardadas = await AsyncStorage.getItem('@transacoes_wisecash');
          if (transacoesGuardadas) {
            const todasTransacoes = JSON.parse(transacoesGuardadas);
            
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth();
            const anoAtual = dataAtual.getFullYear();

            const calculoGastos = {};
            CATEGORIAS_DISPONIVEIS.forEach(cat => calculoGastos[cat] = 0); // Inicializa a zero

            todasTransacoes.forEach(transacao => {
              const dataTransacao = new Date(transacao.data);
              
              // Se a despesa for deste mês e for de uma categoria válida
              if (dataTransacao.getMonth() === mesAtual && 
                  dataTransacao.getFullYear() === anoAtual && 
                  CATEGORIAS_DISPONIVEIS.includes(transacao.categoria)) {
                calculoGastos[transacao.categoria] += transacao.valor;
              }
            });

            setGastosAtuais(calculoGastos);
          }
        } catch (error) {
          console.error('Erro ao carregar orçamentos', error);
        }
      }
      carregarDados();
    }, [])
  );

  function abrirModal(categoria) {
    setCategoriaAtiva(categoria);
    setValorInput(limites[categoria] ? limites[categoria].toString() : '');
    setModalVisivel(true);
  }

  async function guardarLimite() {
    const valorFloat = parseFloat(valorInput.replace(',', '.'));
    
    if (isNaN(valorFloat) || valorFloat <= 0) {
      Alert.alert('Aviso', 'Introduza um valor válido maior que zero.');
      return;
    }

    const novosLimites = { ...limites, [categoriaAtiva]: valorFloat };

    try {
      await AsyncStorage.setItem('@orcamentos_wisecash', JSON.stringify(novosLimites));
      setLimites(novosLimites);
      setModalVisivel(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar o limite.');
    }
  }

  async function removerLimite() {
    const novosLimites = { ...limites };
    delete novosLimites[categoriaAtiva];

    try {
      await AsyncStorage.setItem('@orcamentos_wisecash', JSON.stringify(novosLimites));
      setLimites(novosLimites);
      setModalVisivel(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o limite.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.tituloEcra, { color: colors.text }]}>Orçamentos do Mês</Text>
      <Text style={styles.subtitulo}>Defina tetos de gastos e receba alertas ao aproximar-se do limite.</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {CATEGORIAS_DISPONIVEIS.map(categoria => {
          const limite = limites[categoria];
          const gasto = gastosAtuais[categoria] || 0;
          
          let percentagemGasta = 0;
          let corBarra = colors.primary;
          let mensagemAlerta = null;

          if (limite) {
            percentagemGasta = (gasto / limite) * 100;
            
            // Lógica de Cores e Alertas (Regra dos 80% e 100%)
            if (percentagemGasta >= 100) {
              corBarra = '#FF4C4C'; // Vermelho (Estourou)
              percentagemGasta = 100; // Trava a barra visualmente nos 100%
              mensagemAlerta = "Limite excedido!";
            } else if (percentagemGasta >= 80) {
              corBarra = '#FFA500'; // Laranja (Aviso)
              mensagemAlerta = "Atenção: Atingiu 80% do limite.";
            }
          }

          return (
            <Pressable 
              key={categoria} 
              style={[styles.cartaoOrcamento, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => abrirModal(categoria)}
            >
              <View style={styles.cabecalhoCartao}>
                <Text style={[styles.nomeCategoria, { color: colors.text }]}>{categoria}</Text>
                
                {limite ? (
                  <Text style={[styles.valorTexto, { color: colors.text }]}>
                    R$ {gasto.toFixed(2)} / <Text style={{ color: 'gray' }}>R$ {limite.toFixed(2)}</Text>
                  </Text>
                ) : (
                  <Text style={[styles.definirTexto, { color: colors.primary }]}>+ Definir Limite</Text>
                )}
              </View>

              {limite && (
                <View style={styles.areaProgresso}>
                  <View style={[styles.barraFundo, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={[styles.barraPreenchida, { width: `${percentagemGasta}%`, backgroundColor: corBarra }]} />
                  </View>
                  
                  {mensagemAlerta && (
                    <View style={styles.alertaContainer}>
                      <Ionicons name="warning" size={14} color={corBarra} />
                      <Text style={[styles.textoAlerta, { color: corBarra }]}>{mensagemAlerta}</Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal para Definir/Editar Limite */}
      <Modal visible={modalVisivel} transparent={true} animationType="slide">
        <View style={styles.modalFundo}>
          <View style={[styles.modalCartao, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitulo, { color: colors.text }]}>Limite para {categoriaAtiva}</Text>
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              keyboardType="decimal-pad"
              placeholder="Ex: 500.00"
              placeholderTextColor="gray"
              value={valorInput}
              onChangeText={setValorInput}
            />

            <View style={styles.modalBotoes}>
              {limites[categoriaAtiva] && (
                <Pressable style={[styles.botaoModal, { backgroundColor: '#FF4C4C' }]} onPress={removerLimite}>
                  <Text style={styles.textoBotao}>Remover</Text>
                </Pressable>
              )}
              
              <Pressable style={[styles.botaoModal, { backgroundColor: 'gray' }]} onPress={() => setModalVisivel(false)}>
                <Text style={styles.textoBotao}>Cancelar</Text>
              </Pressable>
              
              <Pressable style={[styles.botaoModal, { backgroundColor: colors.primary }]} onPress={guardarLimite}>
                <Text style={styles.textoBotao}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  tituloEcra: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: 'gray', marginBottom: 20 },
  cartaoOrcamento: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, elevation: 2 },
  cabecalhoCartao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nomeCategoria: { fontSize: 18, fontWeight: 'bold' },
  valorTexto: { fontSize: 16, fontWeight: 'bold' },
  definirTexto: { fontSize: 14, fontWeight: 'bold' },
  areaProgresso: { marginTop: 12 },
  barraFundo: { height: 12, borderRadius: 6, width: '100%', overflow: 'hidden' },
  barraPreenchida: { height: '100%', borderRadius: 6 },
  alertaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  textoAlerta: { fontSize: 12, fontWeight: 'bold' },
  
  // Estilos do Modal
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCartao: { width: '100%', padding: 24, borderRadius: 16, borderWidth: 1 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 18, marginBottom: 24, textAlign: 'center' },
  modalBotoes: { flexDirection: 'row', justifyContent: 'space-around', gap: 10 },
  botaoModal: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  textoBotao: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});