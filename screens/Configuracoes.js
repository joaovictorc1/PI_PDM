import { View, Text, StyleSheet, Switch, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

export default function Configuracoes() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [temSenha, setTemSenha] = useState(false);
  const [senhaAtualInput, setSenhaAtualInput] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [exibirCampoSenha, setExibirCampoSenha] = useState(false);
  const [modoAlteracao, setModoAlteracao] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [senhaAtualVisivel, setSenhaAtualVisivel] = useState(false);
  const [usarBiometria, setUsarBiometria] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function verificarConfiguracoes() {
        const senhaSalva = await AsyncStorage.getItem('@senha_wisecash');
        if (senhaSalva) setTemSenha(true);

        const biometriaSalva = await AsyncStorage.getItem('@biometria_wisecash');
        if (biometriaSalva === 'true') setUsarBiometria(true);
      }
      verificarConfiguracoes();
    }, [])
  );

  async function gerenciarBiometria(ativar) {
    if (ativar) {
      // Verifica se o telemóvel suporta e se o utilizador tem PIN/Biometria configurados
      const temHardware = await LocalAuthentication.hasHardwareAsync();
      const temBiometriaCadastrada = await LocalAuthentication.isEnrolledAsync();

      if (!temHardware || !temBiometriaCadastrada) {
        Alert.alert('Não Disponível', 'O seu dispositivo não possui biometria ou senha de ecrã configurada.');
        return;
      }

      // Faz um teste real para ter a certeza que o utilizador é o dono do aparelho antes de ativar
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme a sua identidade para ativar'
      });

      if (resultado.success) {
        await AsyncStorage.setItem('@biometria_wisecash', 'true');
        setUsarBiometria(true);
      }
    } else {
      await AsyncStorage.setItem('@biometria_wisecash', 'false');
      setUsarBiometria(false);
    }
  }

  async function gerenciarSenha(ativar) {
    if (!ativar) {
      Alert.alert(
        "Remover Proteção", "Tem certeza que deseja remover a senha do aplicativo?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Remover", style: "destructive", onPress: async () => {
              await AsyncStorage.removeItem('@senha_wisecash');
              // Se remover a senha do app, desativa a biometria por segurança
              await AsyncStorage.setItem('@biometria_wisecash', 'false');
              setTemSenha(false);
              setUsarBiometria(false);
              setExibirCampoSenha(false);
              setModoAlteracao(false);
              limparFormularios();
            }
          }
        ]
      );
    } else {
      setExibirCampoSenha(true);
      setModoAlteracao(false);
    }
  }

  function iniciarAlteracao() { setModoAlteracao(true); setExibirCampoSenha(true); limparFormularios(); }
  function cancelarEdicao() { setExibirCampoSenha(false); setModoAlteracao(false); limparFormularios(); }
  function limparFormularios() { setNovaSenha(''); setSenhaAtualInput(''); setSenhaVisivel(false); setSenhaAtualVisivel(false); }

  async function salvarNovaSenha() {
    if (novaSenha.trim().length < 4) { Alert.alert('Aviso', 'A nova senha deve ter no mínimo 4 caracteres.'); return; }
    try {
      if (modoAlteracao) {
        const senhaGuardada = await AsyncStorage.getItem('@senha_wisecash');
        if (senhaAtualInput !== senhaGuardada) { Alert.alert('Acesso Negado', 'A senha atual está incorreta.'); return; }
      }
      await AsyncStorage.setItem('@senha_wisecash', novaSenha);
      setTemSenha(true); setExibirCampoSenha(false); setModoAlteracao(false); limparFormularios();
      Alert.alert('Sucesso', modoAlteracao ? 'A sua palavra-passe foi atualizada!' : 'Palavra-passe configurada com sucesso!');
    } catch (error) { Alert.alert('Erro', 'Não foi possível salvar a senha.'); }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[styles.tituloSecao, { color: colors.text, marginTop: 0 }]}>Minha Conta</Text>
      <Pressable 
        style={[styles.cartao, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }]}
        onPress={() => navigation.navigate('Perfil')}
      >
        <Ionicons name="person-circle" size={40} color={colors.primary} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>Editar Perfil</Text>
          <Text style={{ color: 'gray', fontSize: 14 }}>Foto, nome e ocupação</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="gray" />
      </Pressable>
      {/* --------------------------------------- */}
      
      <Text style={[styles.tituloSecao, { color: colors.text }]}>Segurança e Acesso</Text>
      
      <View style={[styles.cartao, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        <View style={styles.linhaConfig}>
          <View style={styles.infoTextoConfig}>
            <Text style={[styles.textoPrincipal, { color: colors.text }]}>Senha do Aplicativo</Text>
            <Text style={styles.textoSecundario}>Exigir senha ao abrir o Wisecash</Text>
          </View>
          <Switch value={temSenha || (exibirCampoSenha && !modoAlteracao)} onValueChange={gerenciarSenha} trackColor={{ true: colors.primary }} />
        </View>

        {temSenha && !exibirCampoSenha && (
          <Pressable style={[styles.botaoAlterar, { borderTopColor: colors.border }]} onPress={iniciarAlteracao}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
            <Text style={[styles.textoBotaoAlterar, { color: colors.primary }]}>Alterar palavra-passe</Text>
          </Pressable>
        )}

        {/* Módulo de Biometria (Só aparece se a senha do App estiver ativada, pois atua como atalho) */}
        {temSenha && !exibirCampoSenha && (
          <View style={[styles.linhaConfig, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16, paddingTop: 16 }]}>
            <View style={styles.infoTextoConfig}>
              <Text style={[styles.textoPrincipal, { color: colors.text }]}>Biometria / Senha do Sistema</Text>
              <Text style={styles.textoSecundario}>Usar FaceID, TouchID ou PIN do celular para desbloquear</Text>
            </View>
            <Switch value={usarBiometria} onValueChange={gerenciarBiometria} trackColor={{ true: colors.primary }} />
          </View>
        )}

        {/* ... (Todo o formulário de criar/alterar senha continua igual) ... */}
        {exibirCampoSenha && (
          <View style={[styles.areaSenha, { borderTopColor: colors.border }]}>
            {modoAlteracao && (
              <>
                <Text style={[styles.labelSenha, { color: colors.text }]}>Senha atual:</Text>
                <View style={styles.inputContainer}>
                  <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Confirme a senha antiga..." placeholderTextColor="gray" secureTextEntry={!senhaAtualVisivel} value={senhaAtualInput} onChangeText={setSenhaAtualInput} />
                  <Pressable style={styles.iconeOlho} onPress={() => setSenhaAtualVisivel(!senhaAtualVisivel)}><Ionicons name={senhaAtualVisivel ? "eye-off" : "eye"} size={24} color="gray" /></Pressable>
                </View>
              </>
            )}

            <Text style={[styles.labelSenha, { color: colors.text, marginTop: modoAlteracao ? 8 : 0 }]}>{modoAlteracao ? 'Nova senha:' : 'Crie uma senha de acesso:'}</Text>
            <View style={styles.inputContainer}>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} placeholder="Digite a nova senha..." placeholderTextColor="gray" secureTextEntry={!senhaVisivel} value={novaSenha} onChangeText={setNovaSenha} autoFocus={!modoAlteracao} />
              <Pressable style={styles.iconeOlho} onPress={() => setSenhaVisivel(!senhaVisivel)}><Ionicons name={senhaVisivel ? "eye-off" : "eye"} size={24} color="gray" /></Pressable>
            </View>

            <View style={styles.botoesAcaoRow}>
              {modoAlteracao && (<Pressable style={[styles.botaoAcao, { backgroundColor: '#333333', marginRight: 10 }]} onPress={cancelarEdicao}><Text style={styles.textoBotaoBranco}>Cancelar</Text></Pressable>)}
              <Pressable style={[styles.botaoAcao, { backgroundColor: colors.primary, flex: 1 }]} onPress={salvarNovaSenha}><Text style={styles.textoBotaoBranco}>Guardar</Text></Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tituloSecao: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
  cartao: { borderRadius: 12, borderWidth: 1, padding: 16 },
  linhaConfig: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoTextoConfig: { flex: 1, paddingRight: 16 },
  textoPrincipal: { fontSize: 16, fontWeight: 'bold' },
  textoSecundario: { fontSize: 14, color: 'gray', marginTop: 4 },
  botaoAlterar: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  textoBotaoAlterar: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  areaSenha: { marginTop: 16, borderTopWidth: 1, paddingTop: 16 },
  labelSenha: { fontSize: 14, marginBottom: 8, fontWeight: 'bold' },
  inputContainer: { position: 'relative', justifyContent: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, paddingRight: 48, fontSize: 16 },
  iconeOlho: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center', zIndex: 1 },
  botoesAcaoRow: { flexDirection: 'row', width: '100%' },
  botaoAcao: { padding: 12, borderRadius: 8, alignItems: 'center', flex: 1 },
  textoBotaoBranco: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});