import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import BotaoFlutuante from '../components/BotaoFlutuante';
import BarraProgresso from '../components/BarraProgresso';

export default function Dashboard({ navigation }) {
  const { colors } = useTheme();
  
  const [gastoMensal, setGastoMensal] = useState(0);
  const [contasAVencer, setContasAVencer] = useState([]);
  const [orcamentoDefinido, setOrcamentoDefinido] = useState(1500.00); 

  useFocusEffect(
    useCallback(() => {
      async function carregarDadosDashboard() {
        try {
          const dadosGuardados = await AsyncStorage.getItem('@transacoes_wisecash');
          if (dadosGuardados) {
            const todasTransacoes = JSON.parse(dadosGuardados);
            
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth();
            const anoAtual = dataAtual.getFullYear();

            // 1. Cálculo da Barra de Progresso (Gastos do mês atual que já ocorreram ou ocorrem hoje)
            const transacoesDoMes = todasTransacoes.filter(item => {
              const dataItem = new Date(item.data);
              // Consideramos gasto o que é do mês atual e não está no futuro distante
              return dataItem.getMonth() === mesAtual && 
                     dataItem.getFullYear() === anoAtual &&
                     dataItem <= dataAtual;
            });

            const total = transacoesDoMes.reduce((soma, item) => soma + item.valor, 0);
            setGastoMensal(total);

            // 2. Lógica dos Alertas de Vencimento (Próximos 3 dias)
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas os dias
            
            const daquiA3Dias = new Date(hoje);
            daquiA3Dias.setDate(hoje.getDate() + 3);
            daquiA3Dias.setHours(23, 59, 59, 999);

            const alertas = todasTransacoes.filter(item => {
              const dataItem = new Date(item.data);
              return dataItem >= hoje && dataItem <= daquiA3Dias;
            });

            // Ordena as contas pela data de vencimento (as mais urgentes primeiro)
            alertas.sort((a, b) => new Date(a.data) - new Date(b.data));
            setContasAVencer(alertas);
          } else {
            setGastoMensal(0);
            setContasAVencer([]);
          }
        } catch (error) {
          console.error('Erro ao calcular resumo', error);
        }
      }
      carregarDadosDashboard();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
        <Text style={[styles.saudacao, { color: colors.text }]}>
          Resumo de {new Date().toLocaleString('pt-PT', { month: 'long' })}
        </Text>

        <BarraProgresso 
          gastoTotal={gastoMensal} 
          limiteOrcamento={orcamentoDefinido} 
        />

        {/* Secção Dinâmica de Alertas */}
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
              // Formata a data para exibir no cartão
              const dataFormatada = new Date(conta.data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
              
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
        <View style={{ height: 80 }} />
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
  saudacao: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 20,
    textTransform: 'capitalize'
  },
  seccaoAlertas: {
    width: '100%',
    marginTop: 10,
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