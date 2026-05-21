import { View, Text, TextInput, StyleSheet, Button, Alert, Pressable, Platform, ScrollView, Switch, Image } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIAS_DISPONIVEIS = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

export default function GerenciarTransacao({ navigation, route }) {
  const { colors } = useTheme();
  
  const transacaoRecebida = route.params?.transacaoEditada;
  const isEditando = !!transacaoRecebida;
  const isGrupoEdit = isEditando && transacaoRecebida.isGrupo; 

  const [descricao, setDescricao] = useState(isEditando ? (isGrupoEdit ? transacaoRecebida.descricaoBase : transacaoRecebida.descricao) : '');
  const [valor, setValor] = useState(isEditando ? (isGrupoEdit ? transacaoRecebida.valorTotalDaCompra.toString() : transacaoRecebida.valor.toString()) : '');
  const [dataSelecionada, setDataSelecionada] = useState(isEditando ? new Date(transacaoRecebida.data) : new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [categoria, setCategoria] = useState(isEditando && transacaoRecebida.categoria ? transacaoRecebida.categoria : 'Outros');

  const [tags, setTags] = useState(isEditando && transacaoRecebida.tags ? transacaoRecebida.tags : '');
  const [isParcelado, setIsParcelado] = useState(isGrupoEdit ? true : false);
  const [numeroParcelas, setNumeroParcelas] = useState(isGrupoEdit ? transacaoRecebida.parcelas.length.toString() : '1');
  
  // Novo Estado: Anexo de Imagem (Recibo/Fatura)
  const [anexo, setAnexo] = useState(isEditando && transacaoRecebida.anexo ? transacaoRecebida.anexo : null);

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

  // Funções da Câmara e Galeria
  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (permissao.granted === false) {
      Alert.alert('Permissão Negada', 'A aplicação precisa de acesso à câmara para tirar fotos aos recibos.');
      return;
    }
    
    let resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5, // Reduz a qualidade para não ocupar muito espaço no telemóvel
    });

    if (!resultado.canceled) {
      setAnexo(resultado.assets[0].uri);
    }
  }

  async function escolherGaleria() {
    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!resultado.canceled) {
      setAnexo(resultado.assets[0].uri);
    }
  }

  async function guardarTransacao() {
    if (!descricao.trim() || !valor.trim()) {
      Alert.alert('Aviso', 'Preencha a descrição e o valor.');
      return;
    }

    const valorTotal = parseFloat(valor);
    let transacoesParaGuardar = [];

    if (isParcelado && parseInt(numeroParcelas) > 1) {
      const qtdParcelas = parseInt(numeroParcelas);
      const valorPorParcela = valorTotal / qtdParcelas;
      const grupoId = isGrupoEdit ? transacaoRecebida.id : Math.random().toString();

      for (let i = 0; i < qtdParcelas; i++) {
        let dataDaParcela = new Date(dataSelecionada);
        dataDaParcela.setMonth(dataDaParcela.getMonth() + i);

        transacoesParaGuardar.push({
          id: Math.random().toString(),
          grupoId: grupoId,
          descricaoBase: descricao,
          descricao: `${descricao} (${i + 1}/${qtdParcelas})`,
          valor: valorPorParcela,
          valorTotalDaCompra: valorTotal,
          data: dataDaParcela.toISOString(),
          categoria: categoria,
          tags: tags.trim(),
          anexo: anexo // Guarda a imagem no pacote
        });
      }
    } else {
      transacoesParaGuardar.push({
        id: isEditando && !isGrupoEdit ? transacaoRecebida.id : Math.random().toString(),
        descricao: descricao,
        valor: valorTotal,
        data: dataSelecionada.toISOString(),
        categoria: categoria,
        tags: tags.trim(),
        anexo: anexo // Guarda a imagem na transação única
      });
    }

    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      const transacoesAtuais = dadosGuardados ? JSON.parse(dadosGuardados) : [];
      let novaLista = transacoesAtuais;

      if (isEditando) {
        if (isGrupoEdit) {
          novaLista = novaLista.filter(item => item.grupoId !== transacaoRecebida.id);
        } else {
          novaLista = novaLista.filter(item => item.id !== transacaoRecebida.id);
        }
      }
      
      novaLista = [...novaLista, ...transacoesParaGuardar];
      await AsyncStorage.setItem('@transacoes_wisecash', JSON.stringify(novaLista));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar as alterações.');
    }
  }

  async function apagarTransacao() {
    try {
      const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
      const transacoesAtuais = dadosGuardados ? JSON.parse(dadosGuardados) : [];
      
      let novaLista = transacoesAtuais;
      if (isGrupoEdit) {
        novaLista = novaLista.filter(item => item.grupoId !== transacaoRecebida.id);
      } else {
        novaLista = novaLista.filter(item => item.id !== transacaoRecebida.id);
      }
      
      await AsyncStorage.setItem('@transacoes_wisecash', JSON.stringify(novaLista));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível apagar o registo.');
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={descricao} onChangeText={setDescricao} maxLength={30} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Valor Total (R$)</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} keyboardType="decimal-pad" value={valor} onChangeText={handleChangeValor} />
      </View>

      <View style={[styles.parcelaContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.parcelaHeader}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Compra Parcelada?</Text>
          <Switch value={isParcelado} onValueChange={setIsParcelado} trackColor={{ true: colors.primary }} />
        </View>
        
        {isParcelado && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colors.text, marginBottom: 8 }}>Em quantas vezes?</Text>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} keyboardType="number-pad" value={numeroParcelas} onChangeText={setNumeroParcelas} />
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Tags (Opcional)</Text>
        <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Ex: #ViagemSP, #Presente" placeholderTextColor="gray" value={tags} onChangeText={setTags} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Data da Transação</Text>
        <Pressable style={[styles.input, styles.dataBotao, { borderColor: colors.border }]} onPress={() => setMostrarCalendario(true)}>
          <Text style={{ color: colors.text, fontSize: 16 }}>{dataSelecionada.toLocaleDateString('pt-PT')}</Text>
        </Pressable>
      </View>

      {mostrarCalendario && <DateTimePicker value={dataSelecionada} mode="date" display="default" onChange={aoMudarData} />}

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
          {CATEGORIAS_DISPONIVEIS.map(cat => (
            <Pressable key={cat} style={[styles.chip, { borderColor: colors.border }, categoria === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setCategoria(cat)}>
              <Text style={{ color: categoria === cat ? '#FFFFFF' : colors.text, fontWeight: categoria === cat ? 'bold' : 'normal' }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Nova Secção: Anexos (Câmara e Galeria) */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Recibo / Comprovativo</Text>
        
        {anexo ? (
          <View style={styles.anexoContainer}>
            <Image source={{ uri: anexo }} style={styles.imagemAnexo} />
            <Pressable style={styles.botaoRemoverAnexo} onPress={() => setAnexo(null)}>
              <Ionicons name="close-circle" size={32} color="#FF4C4C" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.botoesAnexoRow}>
            <Pressable style={[styles.botaoAnexo, { borderColor: colors.border }]} onPress={tirarFoto}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 4 }}>Câmara</Text>
            </Pressable>
            <Pressable style={[styles.botaoAnexo, { borderColor: colors.border }]} onPress={escolherGaleria}>
              <Ionicons name="images" size={24} color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 4 }}>Galeria</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.botoesContainer}>
        <Button title={isEditando ? "Atualizar" : "Guardar"} color={colors.primary} onPress={guardarTransacao} />
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
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  parcelaContainer: { padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 20 },
  parcelaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // Estilos da nova área de Anexos
  botoesAnexoRow: { flexDirection: 'row', gap: 12 },
  botaoAnexo: { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 16, alignItems: 'center', justifyContent: 'center' },
  anexoContainer: { position: 'relative', marginTop: 8 },
  imagemAnexo: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  botaoRemoverAnexo: { position: 'absolute', top: -10, right: -10, backgroundColor: 'white', borderRadius: 16 }
});