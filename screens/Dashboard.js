import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transacoesApi, orcamentosApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

import BarraProgresso from '../components/BarraProgresso';

const CATEGORIAS_DISPONIVEIS = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

export default function Dashboard() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [perfil, setPerfil] = useState({ nome: '', foto: null });
  const [gastoMensal, setGastoMensal] = useState(0);
  const [contasAVencer, setContasAVencer] = useState([]);
  const [orcamentoDefinido, setOrcamentoDefinido] = useState(1500.00); 

  // Novos estados para a listagem interna de orçamentos por categoria
  const [limitesCategorias, setLimitesCategorias] = useState({});
  const [gastosPorCategoria, setGastosPorCategoria] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarDadosGlobais = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      // 1. Perfil (Mantido no armazenamento local)
      const dadosPerfil = await AsyncStorage.getItem('@perfil_wisecash');
      if (dadosPerfil) {
        const perfilSalvo = JSON.parse(dadosPerfil);
        setPerfil({ nome: perfilSalvo.nome || '', foto: perfilSalvo.foto || null });
      }

      // 2. Busca simultânea no servidor para orçamentos e transações
      const [limitesGuardados, todasTransacoes] = await Promise.all([
        orcamentosApi.listar(),
        transacoesApi.listar()
      ]);

      setLimitesCategorias(limitesGuardados || {});

      // 3. Cálculos e Processamento das Transações
      if (todasTransacoes && todasTransacoes.length > 0) {
        const dataActual = new Date();
        const mesActual = dataActual.getMonth();
        const anoActual = dataActual.getFullYear();

        // Filtrar transações ocorridas no mês atual
        const transacoesDoMes = todasTransacoes.filter(item => {
          const dataItem = new Date(item.data);
          return dataItem.getMonth() === mesActual && 
                 dataItem.getFullYear() === anoActual &&
                 dataItem <= dataActual;
        });

        // Gasto global
        const totalGlobal = transacoesDoMes.reduce((soma, item) => soma + item.valor, 0);
        setGastoMensal(totalGlobal);

        // Gasto individual por categoria
        const mapaGastos = {};
        CATEGORIAS_DISPONIVEIS.forEach(cat => mapaGastos[cat] = 0);
        transacoesDoMes.forEach(item => {
          const cat = item.categoria || 'Outros';
          if (CATEGORIAS_DISPONIVEIS.includes(cat)) {
            mapaGastos[cat] += item.valor;
          }
        });
        setGastosPorCategoria(mapaGastos);

        // Alertas de vencimento (Próximos 3 dias)
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
        setGastosPorCategoria({});
      }
    } catch (error) {
      console.error('Erro ao carregar dados no dashboard', error);
      setErro('Não foi possível ligar ao servidor para atualizar o painel.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDadosGlobais();
    }, [carregarDadosGlobais])
  );

  const categoriasComLimite = Object.keys(limitesCategorias);
  const primeiroNome = perfil.nome ? perfil.nome.split(' ')[0] : 'Visitante';

if (carregando) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Text style={styles.textoErro}>{erro}</Text>
        <Pressable onPress={carregarDados} style={[styles.botaoRetry, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.primary }}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
        
        {/* Cabeçalho Perfil */}
        <Pressable style={styles.headerPerfil} onPress={() => navigation.navigate('Perfil')}>
          <View style={styles.infoTexto}>
            <Text style={styles.saudacao}>Olá,</Text>
            <Text style={[styles.nome, { color: colors.text }]}>{primeiroNome}!</Text>
          </View>
          <View style={styles.fotoContainer}>
            {perfil.foto ? (
              <Image source={{ uri: perfil.foto }} style={[styles.foto, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.fotoPlaceholder, { backgroundColor: colors.border }]}><Ionicons name="person" size={24} color="gray" /></View>
            )}
          </View>
        </Pressable>

        {/* Resumo e Barra de Progresso Global */}
        <Text style={[styles.tituloResumo, { color: colors.text }]}>
          Resumo de {new Date().toLocaleString('pt-BR', { month: 'long' })}
        </Text>
        <BarraProgresso gastoTotal={gastoMensal} limiteOrcamento={orcamentoDefinido} />

        {/* SECÇÃO NOVA: Orçamentos por Categoria (Só renderiza se houver limites criados) */}
        {categoriasComLimite.length > 0 && (
          <View style={styles.seccaoOrcamentos}>
            <Text style={[styles.tituloSeccao, { color: colors.text }]}>Orçamentos Ativos</Text>
            {categoriasComLimite.map(cat => {
              const limite = limitesCategorias[cat];
              const gasto = gastosPorCategoria[cat] || 0;
              let percentagem = (gasto / limite) * 100;
              
              let corBarra = colors.primary;
              if (percentagem >= 100) { corBarra = '#FF4C4C'; percentagem = 100; }
              else if (percentagem >= 80) corBarra = '#FFA500';

              return (
                <View key={cat} style={[styles.cartaoMiniOrcamento, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.topoMiniCartao}>
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>{cat}</Text>
                    <Text style={{ color: 'gray', fontSize: 12 }}>
                      R$ {gasto.toFixed(2)} / <Text style={{ fontWeight: 'bold', color: colors.text }}>R$ {limite.toFixed(2)}</Text>
                    </Text>
                  </View>
                  <View style={styles.barraFundoMini}>
                    <View style={[styles.barraPreenchidaMini, { width: `${percentagem}%`, backgroundColor: corBarra }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Alertas */}
        <View style={styles.seccaoAlertas}>
          <Text style={[styles.tituloSeccao, { color: colors.text }]}>Atenção: Próximos 3 Dias</Text>
          {contasAVencer.length === 0 ? (
            <View style={[styles.cartaoVazio, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 8 }}>Nenhuma conta a vencer em breve!</Text>
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
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>R$ {conta.valor.toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, alignItems: 'center' },
  headerPerfil: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8, width: '100%' },
  infoTexto: { flex: 1 },
  saudacao: { fontSize: 16, color: 'gray' },
  nome: { fontSize: 28, fontWeight: 'bold' },
  fotoContainer: { position: 'relative' },
  foto: { width: 56, height: 56, borderRadius: 28, borderWidth: 2 },
  fotoPlaceholder: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  tituloResumo: { fontSize: 22, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 16, textTransform: 'capitalize' },
  seccaoAlertas: { width: '100%', marginTop: 24 },
  tituloSeccao: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  cartaoVazio: { padding: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  cartaoAlerta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, elevation: 2 },
  alertaEsquerda: { flexDirection: 'row', alignItems: 'center' },
  
  // Novos estilos para os mini-orçamentos do Dashboard
  seccaoOrcamentos: { width: '100%', marginTop: 24 },
  cartaoMiniOrcamento: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  topoMiniCartao: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barraFundoMini: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', overflow: 'hidden' },
  barraPreenchidaMini: { height: '100%', borderRadius: 3 }
});