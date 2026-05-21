import { View, Text, StyleSheet, Pressable, Image, Modal, SafeAreaView } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function DespesaItem(props) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [expandido, setExpandido] = useState(false);
  const [modalImagemVisivel, setModalImagemVisivel] = useState(false); // Estado para controlar o ecrã inteiro

  const isGrupo = props.isGrupo;
  
  const temAnexo = isGrupo ? props.parcelas.some(p => p.anexo) : !!props.anexo;
  const imagemAnexo = isGrupo ? props.parcelas.find(p => p.anexo)?.anexo : props.anexo;

  const dataFormatada = new Date(props.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  function abrirEdicao(itemEditado) {
    navigation.navigate('GerenciarTransacao', { transacaoEditada: itemEditado });
  }

  const podeExpandir = isGrupo || temAnexo;

  return (
    <>
      <View style={[styles.itemBase, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.conteudoPrincipal}>
          <Pressable 
            style={styles.areaExpansivel}
            onPress={() => podeExpandir ? setExpandido(!expandido) : null}
          >
            <View style={styles.infoEsquerda}>
              <Text style={[styles.descricao, { color: colors.text }]}>
                {isGrupo ? props.descricaoBase : props.descricao}
              </Text>
              
              <View style={styles.detalhesRow}>
                <Text style={[styles.data, { color: 'gray' }]}>{dataFormatada}</Text>
                
                {props.categoria && (
                  <View style={[styles.badgeCategoria, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>{props.categoria}</Text>
                  </View>
                )}
                
                {isGrupo && (
                  <Text style={{ color: 'gray', fontSize: 12, marginLeft: 8 }}>
                    ({props.parcelas.length}x)
                  </Text>
                )}

                {temAnexo && (
                  <Ionicons name="image-outline" size={16} color="gray" style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>

            <View style={styles.acoesDireita}>
              <Text style={[styles.valor, { color: colors.primary }]}>
                R$ {(isGrupo ? props.valorTotalDaCompra : props.valor).toFixed(2)}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => abrirEdicao(props)} style={styles.botaoAcao}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {podeExpandir && expandido && (
          <View style={[styles.areaExpandida, { borderTopColor: colors.border }]}>
            
            {temAnexo && (
              <View style={styles.anexoContainer}>
                <Text style={{ color: 'gray', marginBottom: 8, fontSize: 12, alignSelf: 'flex-start' }}>
                  Comprovante anexado:
                </Text>
                
                {/* Botão que abre a imagem em ecrã inteiro */}
                <Pressable onPress={() => setModalImagemVisivel(true)} style={styles.miniaturaContainer}>
                  <Image source={{ uri: imagemAnexo }} style={styles.imagemRecibo} />
                  <View style={styles.overlayLupa}>
                    <Ionicons name="search" size={32} color="#FFFFFF" />
                  </View>
                </Pressable>
              </View>
            )}

            {isGrupo && props.parcelas.map(parcela => {
              const estaPaga = new Date(parcela.data) <= new Date();
              
              return (
                <View key={parcela.id} style={styles.linhaParcela}>
                  <View>
                    <Text style={{ color: colors.text }}>{parcela.descricao}</Text>
                    <Text style={{ color: 'gray', fontSize: 12 }}>
                      {new Date(parcela.data).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  
                  <View style={styles.acoesDireita}>
                    <Text style={{ color: estaPaga ? colors.primary : '#FF4C4C', fontWeight: 'bold' }}>
                      R$ {parcela.valor.toFixed(2)}
                    </Text>
                    
                    <Pressable onPress={() => abrirEdicao(parcela)} style={{ marginLeft: 12, padding: 4 }}>
                      <Ionicons name="pencil" size={16} color="gray" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* MODAL NATIVO: Visualizador de Imagem em Ecrã Inteiro */}
      <Modal
        visible={modalImagemVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalImagemVisivel(false)}
      >
        <SafeAreaView style={styles.modalFundo}>
          <View style={styles.cabecalhoModal}>
            <Pressable onPress={() => setModalImagemVisivel(false)} style={styles.botaoFecharModal}>
              <Ionicons name="close" size={32} color="#FFFFFF" />
            </Pressable>
          </View>
          
          {/* resizeMode="contain" garante que a imagem não é cortada */}
          <Image source={{ uri: imagemAnexo }} style={styles.imagemFullscreen} resizeMode="contain" />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  itemBase: { marginVertical: 8, borderWidth: 1, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  conteudoPrincipal: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaExpansivel: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoEsquerda: { flex: 1, marginRight: 10 },
  descricao: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  detalhesRow: { flexDirection: 'row', alignItems: 'center' },
  data: { fontSize: 14, marginRight: 10 },
  badgeCategoria: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  acoesDireita: { flexDirection: 'row', alignItems: 'center' },
  valor: { fontSize: 16, fontWeight: 'bold' },
  botaoAcao: { marginLeft: 12, padding: 8 },
  areaExpandida: { borderTopWidth: 1, padding: 12, backgroundColor: 'rgba(0,0,0,0.1)' },
  linhaParcela: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  
  // Estilos da miniatura e lupa
  anexoContainer: { marginBottom: 16, alignItems: 'center', width: '100%' },
  miniaturaContainer: { width: '100%', position: 'relative' },
  imagemRecibo: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  overlayLupa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  
  // Estilos do Modal Ecrã Inteiro
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  cabecalhoModal: { width: '100%', alignItems: 'flex-end', padding: 16, position: 'absolute', top: 40, zIndex: 10 },
  botaoFecharModal: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24 },
  imagemFullscreen: { width: '100%', height: '80%' }
});