import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// O 'route' foi adicionado aqui para podermos receber os dados da tela anterior
export default function GerenciarMeta({ navigation, route }) {
  const { colors } = useTheme();

  // Verifica se estamos a editar uma meta existente recebida por parâmetro
  const metaEditada = route.params?.metaEditada;

  // Se houver uma metaEditada, os estados já começam preenchidos com os dados dela
  const [nomeMeta, setNomeMeta] = useState(metaEditada ? metaEditada.nome : '');
  const [valorAlvo, setValorAlvo] = useState(metaEditada ? metaEditada.valorAlvo.toString() : '');
  const [depositoMensal, setDepositoMensal] = useState(metaEditada ? metaEditada.depositoMensal.toString() : '');
  // Adicionámos suporte para guardar e recuperar a taxa de juros!
  const [taxaJuros, setTaxaJuros] = useState(metaEditada && metaEditada.taxaJuros ? metaEditada.taxaJuros.toString() : '');

  // Muda o título da tela de "Planejar Nova Meta" para "Editar Meta" caso seja uma edição
  useEffect(() => {
    if (metaEditada) {
      navigation.setOptions({ title: 'Editar Meta' });
    }
  }, [metaEditada, navigation]);

  function calcularPrevisao() {
    const alvo = parseFloat(valorAlvo.replace(',', '.'));
    const aporte = parseFloat(depositoMensal.replace(',', '.'));
    const taxa = parseFloat(taxaJuros.replace(',', '.')) / 100;

    if (!alvo || !aporte || !taxa || taxa === 0) return null;

    const numerador = Math.log((alvo * taxa) / aporte + 1);
    const denominador = Math.log(1 + taxa);
    const nMeses = Math.ceil(numerador / denominador);

    const dataPrevisao = new Date();
    dataPrevisao.setMonth(dataPrevisao.getMonth() + nMeses);

    return {
      meses: nMeses,
      data: dataPrevisao.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      totalInvestido: aporte * nMeses,
      jurosGanhos: alvo - (aporte * nMeses)
    };
  }

  const projecao = calcularPrevisao();

  async function guardarMeta() {
    if (!nomeMeta.trim() || !projecao) {
      Alert.alert('Aviso', 'Preencha todos os campos corretamente para simular e guardar a meta.');
      return;
    }

    // Se estivermos a editar, mantemos o ID antigo. Se for nova, criamos um ID novo.
    const idMeta = metaEditada ? metaEditada.id : Math.random().toString();

    const novaMeta = {
      id: idMeta,
      nome: nomeMeta,
      valorAlvo: parseFloat(valorAlvo.replace(',', '.')),
      depositoMensal: parseFloat(depositoMensal.replace(',', '.')),
      taxaJuros: parseFloat(taxaJuros.replace(',', '.')), // Agora guardamos a taxa!
      previsaoData: projecao.data,
      meses: projecao.meses
    };

    try {
      const dadosAtuais = await AsyncStorage.getItem('@metas_wisecash');
      let listaAtual = dadosAtuais ? JSON.parse(dadosAtuais) : [];

      if (metaEditada) {
        // Modo Edição: Substitui a meta antiga pela meta atualizada na lista
        listaAtual = listaAtual.map(item => item.id === idMeta ? novaMeta : item);
      } else {
        // Modo Criação: Apenas empilha no final
        listaAtual = [...listaAtual, novaMeta];
      }
      
      await AsyncStorage.setItem('@metas_wisecash', JSON.stringify(listaAtual));
      
      Alert.alert('Sucesso', metaEditada ? 'A meta foi atualizada!' : 'A meta foi guardada!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar a meta.');
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[styles.cartaoFormulario, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Qual é o seu objetivo?</Text>
          <TextInput 
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Viagem ao Japão"
            placeholderTextColor="gray"
            value={nomeMeta}
            onChangeText={setNomeMeta}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Valor Alvo (R$)</Text>
          <TextInput 
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="10000.00"
            keyboardType="decimal-pad"
            placeholderTextColor="gray"
            value={valorAlvo}
            onChangeText={setValorAlvo}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Poupança Mensal</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="500.00"
              keyboardType="decimal-pad"
              placeholderTextColor="gray"
              value={depositoMensal}
              onChangeText={setDepositoMensal}
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Rentabilidade Mês (%)</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="0.8"
              keyboardType="decimal-pad"
              placeholderTextColor="gray"
              value={taxaJuros}
              onChangeText={setTaxaJuros}
            />
          </View>
        </View>
      </View>

      {projecao && (
        <View style={[styles.cartaoResultado, { backgroundColor: colors.primary }]}>
          <Ionicons name="trophy" size={40} color="#FFFFFF" style={{ alignSelf: 'center', marginBottom: 10 }} />
          <Text style={styles.textoResultadoDestaque}>
            Alcançará a sua meta em {projecao.meses} meses!
          </Text>
          <Text style={styles.textoResultadoData}>Previsão: {projecao.data}</Text>
          
          <Pressable 
            style={({ pressed }) => [styles.botaoGuardar, pressed && { opacity: 0.8 }]} 
            onPress={guardarMeta}
          >
            <Text style={styles.textoBotaoGuardar}>
              {metaEditada ? 'ATUALIZAR META' : 'GUARDAR ESTA META'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cartaoFormulario: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  cartaoResultado: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  textoResultadoDestaque: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  textoResultadoData: { color: '#E0F7FA', fontSize: 16, textTransform: 'capitalize', marginBottom: 20 },
  botaoGuardar: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 10 },
  textoBotaoGuardar: { color: '#2E8B57', fontWeight: 'bold', fontSize: 16 }
});