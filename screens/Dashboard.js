import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import BotaoFlutuante from '../components/BotaoFlutuante';
import BarraProgresso from '../components/BarraProgresso';

export default function Dashboard() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  // Estado para armazenar os dados do utilizador
  const [perfil, setPerfil] = useState({ nome: '', foto: null });

  // Estados dos cálculos financeiros
  const [gastoMensal, setGastoMensal] = useState(0);
  const [contasAVencer, setContasAVencer] = useState([]);
  const [orcamentoDefinido, setOrcamentoDefinido] = useState(1500.00); 

  useFocusEffect(
    useCallback(() => {
      async function carregarDadosGlobais() {
        try {
          // 1. Carrega as informações do Perfil
          const dadosPerfil = await AsyncStorage.getItem('@perfil_wisecash');
          if (dadosPerfil) {
            const perfilSalvo = JSON.parse(dadosPerfil);
            setPerfil({
              nome: perfilSalvo.nome || '',
              foto: perfilSalvo.foto || null
            });
          }

          // 2. Carrega as Transações para a Barra de Progresso e Alertas
          const dadosTransacoes = await AsyncStorage.getItem('@transacoes_wisecash');
          if (dadosTransacoes) {
            const todasTransacoes = JSON.parse(dadosTransacoes);
            
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth();
            const anoAtual = dataAtual.getFullYear();

            // Cálculo da Barra de Progresso
            const transacoesDoMes = todasTransacoes.filter(item => {
              const dataItem = new Date(item.data);
              return dataItem.getMonth() === mesAtual && 
                     dataItem.getFullYear() === anoAtual &&
                     dataItem <= dataAtual;
            });

            const total = transacoesDoMes.reduce((soma, item) => soma + item.valor, 0);
            setGastoMensal(total);

            // Lógica dos Alertas de Vencimento (Próximos 3 dias)
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0); 
            
            const daquiA3Dias = new Date(hoje);
            daquiA3Dias.setDate(hoje.getDate() + 3);
            daquiA3Dias.setHours(23, 59, 59, 999);

            const alertas = todasTransacoes.filter(item => {
              const dataItem = new Date(item.data);
              return dataItem >= hoje && dataItem <= daquiA3Dias;
            });

            alertas.sort((a, b) => new Date(a.data) - new Date(b.data));
            setContasAVencer(alertas);
          } else {
            setGastoMensal(0);
            setContasAVencer([]);
          }
        } catch (error) {
          console.error('Erro ao carregar os dados no dashboard', error);
        }
      }
      carregarDadosGlobais();
    }, [])
  );

  const primeiroNome = perfil.nome ? perfil.nome.split(' ')[0] : 'Visitante';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
        
        {/* --- CABEÇALHO DO PERFIL --- */}
        <Pressable 
          style={styles.headerPerfil} 
          onPress={() => navigation.navigate('Perfil')} 
        >
          <View style={styles.infoTexto}>
            <Text style={styles.saudacao}>Olá,</Text>
            <Text style={[styles.nome, { color: colors.text }]}>{primeiroNome}!</Text>
          </View>

          <View style={styles.fotoContainer}>
            {perfil.foto ? (
              <Image source={{ uri: perfil.foto }} style={[styles.foto, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.fotoPlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="person" size={24} color="gray" />
              </View>
            )}
          </View>
        </Pressable>

        {/* --- RESUMO E BARRA DE PROGRESSO --- */}
        <Text style={[styles.tituloResumo, { color: colors.text }]}>
          Resumo de {new Date().toLocaleString('pt-BR', { month: 'long' })}
        </Text>

        <BarraProgresso 
          gastoTotal={gastoMensal} 
          limiteOrcamento={orcamentoDefinido} 
        />

        {/* --- ALERTAS E CONTAS A VENCER --- */}
        <View style={styles.seccaoAlertas}>
          <Text style={[styles.tituloSeccao, { color: colors.text }]}>
            Atenção: Próximos 3 Dias
          </Text>

          {contasAVencer.length === 0 ? (
            <View style={[styles.cartaoVazio, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 8 }}>
                Nenhuma conta a vencer em breve!
              </Text>
            </View>
          ) : (
            contasAVencer.map((conta) => {
              const dataFormatada = new Date(conta.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              
              return (
                <View key={conta.id} style={[styles.cartaoAlerta, { backgroundColor: '#3A1C1C', borderColor: '#FF4C4C' }]}>
                  <View style={styles.alertaEsquerda}>
                    <Ionicons name="warning" size={24} color="#FF4C4C" style={{ marginRight: 10 }} />
                    <View>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>{conta.descricao}</Text>
                      <Text style={{ color: '#FF9999', fontSize: 14 }}>Vence a {dataFormatada}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                    R$ {conta.valor.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
        
        {/* Espaçamento extra no fundo para o botão flutuante não tapar o conteúdo */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* O Botão Flutuante mantém-se fixo na ecrã, fora do ScrollView */}
      <BotaoFlutuante onPress={() => navigation.navigate('GerenciarTransacao')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center'
  },
  
  // Estilos do Cabeçalho de Perfil
  headerPerfil: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    marginTop: 8,
    width: '100%'
  },
  infoTexto: { flex: 1 },
  saudacao: { fontSize: 16, color: 'gray' },
  nome: { fontSize: 28, fontWeight: 'bold' },
  fotoContainer: { position: 'relative' },
  foto: { width: 56, height: 56, borderRadius: 28, borderWidth: 2 },
  fotoPlaceholder: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },

  // Estilos da Secção de Resumo
  tituloResumo: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 16,
    textTransform: 'capitalize'
  },

  // Estilos dos Alertas
  seccaoAlertas: {
    width: '100%',
    marginTop: 24,
  },
  tituloSeccao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cartaoVazio: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed'
  },
  cartaoAlerta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  alertaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});