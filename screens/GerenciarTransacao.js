import { View, Text, TextInput, StyleSheet, Button, Alert, Pressable, Platform, ScrollView } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';


const CATEGORIAS_DISPONIVEIS = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

export default function GerenciarTransacao({ navigation, route }) {
  const { colors } = useTheme();
  
  const transacaoRecebida = route.params?.transacaoEditada;
  const isEditando = !!transacaoRecebida;

  const [descricao, setDescricao] = useState(isEditando ? transacaoRecebida.descricao : '');
  const [valor, setValor] = useState(isEditando ? transacaoRecebida.valor.toString() : '');
  const [dataSelecionada, setDataSelecionada] = useState(isEditando ? new Date(transacaoRecebida.data) : new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  

  const [categoria, setCategoria] = useState(isEditando && transacaoRecebida.categoria ? transacaoRecebida.categoria : 'Outros');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditando ? 'Editar Transação' : 'Nova Transação'
    });
  }, [navigation, isEditando]);

  function handleChangeValor(texto) {
    const textoLimpo = texto.replace(',', '.');
    const match = textoLimpo.match(/^\d*\.?\d{0,2}$/);
    if (match) setValor(textoLimpo);
  }

  function aoMudarData(evento, dataEscolhida) {
    if (Platform.OS === 'android') setMostrarCalendario(false);
    if (dataEscolhida) setDataSelecionada(dataEscolhida);
  }

  async function guardarTransacao() {
    if (!descricao.trim() || !valor.trim()) {
      Alert.alert('Aviso', 'Preencha a descrição e o valor.');
      return;
    }

    const transacaoPronta = {
      id: isEditando ? transacaoRecebida.id : Math.random().toString(),
      descricao: descricao,
      valor: parseFloat(valor),
      data: dataSelecionada.toISOString(),
      categoria: categoria, 
    };

    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      const transacoesAtuais = dadosGuardados ? JSON.parse(dadosGuardados) : [];
      
      let novaLista;
      if (isEditando) {
        novaLista = transacoesAtuais.map(item => item.id === transacaoRecebida.id ? transacaoPronta : item);
      } else {
        novaLista = [...transacoesAtuais, transacaoPronta];
      }
      
      await AsyncStorage.setItem('@transacoes_wisecash', JSON.stringify(novaLista));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar.');
    }
  }

  async function apagarTransacao() {
    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      const transacoesAtuais = dadosGuardados ? JSON.parse(dadosGuardados) : [];
      const novaLista = transacoesAtuais.filter(item => item.id !== transacaoRecebida.id);
      
      await AsyncStorage.setItem('@transacoes_wisecash', JSON.stringify(novaLista));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível apagar.');
    }
  }

  const dataFormatada = dataSelecionada.toLocaleDateString('pt-PT');

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          value={descricao} onChangeText={setDescricao} maxLength={30}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Valor (€/R$)</Text>
        <TextInput 
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          keyboardType="decimal-pad" value={valor} onChangeText={handleChangeValor}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Data da Transação</Text>
        <Pressable 
          style={[styles.input, styles.dataBotao, { borderColor: colors.border }]}
          onPress={() => setMostrarCalendario(true)}
        >
          <Text style={{ color: colors.text, fontSize: 16 }}>{dataFormatada}</Text>
        </Pressable>
      </View>

      {mostrarCalendario && (
        <DateTimePicker value={dataSelecionada} mode="date" display="default" onChange={aoMudarData} />
      )}


      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
          {CATEGORIAS_DISPONIVEIS.map(cat => (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                { borderColor: colors.border },
                categoria === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={{ 
                color: categoria === cat ? '#FFFFFF' : colors.text,
                fontWeight: categoria === cat ? 'bold' : 'normal'
              }}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.botoesContainer}>
        <Button 
          title={isEditando ? "Atualizar" : "Guardar"} 
          color={colors.primary} 
          onPress={guardarTransacao} 
        />
      </View>

      {isEditando && (
        <View style={styles.lixeiraContainer}>
          <Ionicons name="trash" size={36} color="#FF4C4C" onPress={apagarTransacao} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  dataBotao: { justifyContent: 'center' },
  botoesContainer: { marginTop: 10, paddingBottom: 40 },
  lixeiraContainer: { marginTop: 20, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: '#2A2A2A', paddingBottom: 40 },
  categoriasScroll: { flexDirection: 'row', marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
});