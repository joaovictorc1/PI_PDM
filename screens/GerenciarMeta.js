import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function GerenciarMeta({ navigation }) {
  const { colors } = useTheme();

  // Estados do formulário transferidos para cá
  const [nomeMeta, setNomeMeta] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [depositoMensal, setDepositoMensal] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');

  // Lógica matemática idêntica à original
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

  // Guarda puxando os dados atuais direto do banco local antes de empilhar
  async function guardarMeta() {
    if (!nomeMeta.trim() || !projecao) {
      Alert.alert('Aviso', 'Preencha todos os campos corretamente para simular e guardar a meta.');
      return;
    }

    const novaMeta = {
      id: Math.random().toString(),
      nome: nomeMeta,
      valorAlvo: parseFloat(valorAlvo.replace(',', '.')),
      depositoMensal: parseFloat(depositoMensal.replace(',', '.')),
      previsaoData: projecao.data,
      meses: projecao.meses
    };

    try {
      const dadosAtuais = await AsyncStorage.getItem('@metas_wisecash');
      const listaAtual = dadosAtuais ? JSON.parse(dadosAtuais) : [];
      const novaLista = [...listaAtual, novaMeta];
      
      await AsyncStorage.setItem('@metas_wisecash', JSON.stringify(novaLista));
      
      Alert.alert('Sucesso', 'A sua meta foi guardada com sucesso!', [
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
            <Text style={styles.textoBotaoGuardar}>GUARDAR ESTA META</Text>
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