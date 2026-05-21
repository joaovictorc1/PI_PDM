import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Metas() {
  const { colors } = useTheme();

  // Estados do formulário
  const [nomeMeta, setNomeMeta] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [depositoMensal, setDepositoMensal] = useState('');
  const [taxaJuros, setTaxaJuros] = useState('');

  // Estado para a lista de metas guardadas
  const [listaMetas, setListaMetas] = useState([]);

  // Carrega as metas sempre que o ecrã é aberto
  useFocusEffect(
    useCallback(() => {
      async function carregarMetas() {
        try {
          const dados = await AsyncStorage.getItem('@metas_wisecash');
          if (dados) {
            setListaMetas(JSON.parse(dados));
          }
        } catch (error) {
          console.error('Erro ao carregar metas', error);
        }
      }
      carregarMetas();
    }, [])
  );

  // Função matemática para prever a data
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
      data: dataPrevisao.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }),
      totalInvestido: aporte * nMeses,
      jurosGanhos: alvo - (aporte * nMeses)
    };
  }

  const projecao = calcularPrevisao();

  // Função para guardar a meta no AsyncStorage
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
      const novaLista = [...listaMetas, novaMeta];
      await AsyncStorage.setItem('@metas_wisecash', JSON.stringify(novaLista));
      setListaMetas(novaLista);
      
      // Limpa o formulário após guardar
      setNomeMeta('');
      setValorAlvo('');
      setDepositoMensal('');
      setTaxaJuros('');
      Alert.alert('Sucesso', 'A sua meta foi guardada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar a meta.');
    }
  }

  // Função para apagar uma meta
  async function apagarMeta(id) {
    try {
      const novaLista = listaMetas.filter(meta => meta.id !== id);
      await AsyncStorage.setItem('@metas_wisecash', JSON.stringify(novaLista));
      setListaMetas(novaLista);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível apagar a meta.');
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={[styles.titulo, { color: colors.text }]}>Planeador de Metas</Text>
      
      {/* Formulário de Simulação */}
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

      {/* Cartão de Resultado da Previsão */}
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

      {/* Lista de Metas Guardadas */}
      <Text style={[styles.tituloSeccao, { color: colors.text, marginTop: 10 }]}>As Minhas Metas</Text>
      
      {listaMetas.length === 0 ? (
        <Text style={{ color: 'gray', textAlign: 'center', marginTop: 10, paddingBottom: 40 }}>
          Ainda não guardou nenhuma meta. Utilize o simulador acima.
        </Text>
      ) : (
        <View style={{ paddingBottom: 40 }}>
          {listaMetas.map((meta) => (
            <View key={meta.id} style={[styles.cartaoMetaGuardada, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>{meta.nome}</Text>
                <Text style={{ color: 'gray', fontSize: 14, marginTop: 4 }}>
                  Alvo: R$ {meta.valorAlvo.toFixed(2)} | Aporte: R$ {meta.depositoMensal.toFixed(2)}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 14, marginTop: 8, fontWeight: 'bold' }}>
                  <Ionicons name="calendar-outline" size={14} /> Conclusão em {meta.previsaoData}
                </Text>
              </View>
              
              <Pressable onPress={() => apagarMeta(meta.id)} style={styles.botaoApagar}>
                <Ionicons name="trash-outline" size={24} color="#FF4C4C" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  cartaoFormulario: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  inputContainer: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  
  cartaoResultado: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  textoResultadoDestaque: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  textoResultadoData: { color: '#E0F7FA', fontSize: 16, textTransform: 'capitalize', marginBottom: 20 },
  
  botaoGuardar: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 10 },
  textoBotaoGuardar: { color: '#2E8B57', fontWeight: 'bold', fontSize: 16 },
  
  tituloSeccao: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  cartaoMetaGuardada: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  botaoApagar: { padding: 8 }
});