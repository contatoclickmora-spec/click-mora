import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  Building2,
  AlertTriangle,
  CheckCircle,
  History
} from "lucide-react";
import { getUserRole } from "../components/utils/authUtils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de abreviações comuns
const ABBREVIATIONS = {
  'r': 'rua',
  'r.': 'rua',
  'av': 'avenida',
  'av.': 'avenida',
  'pca': 'praca',
  'pca.': 'praca',
  'pc': 'praca',
  'pc.': 'praca',
  'trav': 'travessa',
  'trav.': 'travessa',
  'tv': 'travessa',
  'tv.': 'travessa',
  'al': 'alameda',
  'al.': 'alameda',
  'est': 'estrada',
  'est.': 'estrada',
  'rod': 'rodovia',
  'rod.': 'rodovia',
  'br': 'rodovia br',
  'cj': 'conjunto',
  'cj.': 'conjunto',
  'conj': 'conjunto',
  'conj.': 'conjunto',
  'res': 'residencial',
  'res.': 'residencial',
  'cond': 'condominio',
  'cond.': 'condominio',
  'edf': 'edificio',
  'edf.': 'edificio',
  'ed': 'edificio',
  'ed.': 'edificio',
  'n': 'numero',
  'n.': 'numero',
  'nº': 'numero',
  'no': 'numero',
  'no.': 'numero',
  's/n': 'sn',
  's/nº': 'sn'
};

// Remove acentos
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Normaliza o endereço
function normalizeAddress(address) {
  if (!address) return '';
  
  let normalized = removeAccents(address.toLowerCase().trim());
  
  // Remove pontuação extra exceto vírgulas e hífens
  normalized = normalized.replace(/[^\w\s,\-]/g, ' ');
  
  // Substitui abreviações
  const words = normalized.split(/\s+/);
  const expandedWords = words.map(word => ABBREVIATIONS[word] || word);
  normalized = expandedWords.join(' ');
  
  // Remove "de", "da", "do", "das", "dos" isolados
  normalized = normalized.replace(/\b(de|da|do|das|dos)\b/g, '');
  
  // Colapsa espaços múltiplos
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// Extrai endereço útil (primeiros 2 elementos separados por vírgula)
function extractUsefulAddress(fullAddress) {
  if (!fullAddress) return '';
  
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  
  return parts[0] || '';
}

// Calcula similaridade entre duas strings (Levenshtein-based)
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  
  return dp[m][n];
}

// Calcula similaridade em porcentagem
function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(str1, str2);
  return ((maxLen - distance) / maxLen) * 100;
}

// Token sort ratio (similar ao RapidFuzz)
function tokenSortRatio(str1, str2) {
  const tokens1 = str1.split(/\s+/).sort().join(' ');
  const tokens2 = str2.split(/\s+/).sort().join(' ');
  return calculateSimilarity(tokens1, tokens2);
}

// Agrupa endereços similares
function clusterAddresses(addresses, threshold, fuzzySensitivity) {
  const clusters = [];
  const assigned = new Set();
  
  for (let i = 0; i < addresses.length; i++) {
    if (assigned.has(i)) continue;
    
    const cluster = {
      canonical: addresses[i].normalized,
      examples: [addresses[i].original],
      rows: [addresses[i].rowIndex],
      count: 1
    };
    
    assigned.add(i);
    
    for (let j = i + 1; j < addresses.length; j++) {
      if (assigned.has(j)) continue;
      
      const similarity = tokenSortRatio(addresses[i].normalized, addresses[j].normalized);
      
      if (similarity >= fuzzySensitivity) {
        cluster.examples.push(addresses[j].original);
        cluster.rows.push(addresses[j].rowIndex);
        cluster.count++;
        assigned.add(j);
      }
    }
    
    if (cluster.count >= threshold) {
      clusters.push(cluster);
    }
  }
  
  return clusters.sort((a, b) => b.count - a.count);
}

// Parse CSV
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const row = [];
    let inQuotes = false;
    let current = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
}

export default function PotenciaisCondominios() {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [results, setResults] = useState([]);
  
  const [threshold, setThreshold] = useState(8);
  const [fuzzySensitivity, setFuzzySensitivity] = useState(85);
  
  const [showRowsModal, setShowRowsModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    checkAccess();
    loadHistory();
  }, []);

  const checkAccess = async () => {
    try {
      const role = await getUserRole();
      
      if (role.userType !== 'admin_master') {
        setAccessDenied(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      setAccessDenied(true);
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await base44.entities.LogSistema.filter({
        tipo_acao: 'upload_potenciais_condominios'
      });
      setUploadHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isValid = validTypes.some(type => uploadedFile.type.includes(type)) || 
                    uploadedFile.name.endsWith('.csv') || 
                    uploadedFile.name.endsWith('.xlsx');
    
    if (!isValid) {
      alert('Por favor, envie um arquivo CSV ou Excel (.xlsx)');
      return;
    }
    
    if (uploadedFile.size > 20 * 1024 * 1024) {
      alert('Arquivo muito grande. Limite máximo: 20MB');
      return;
    }
    
    setFile(uploadedFile);
    setProcessing(true);
    setProgress(10);
    
    try {
      let data = [];
      
      if (uploadedFile.name.endsWith('.csv') || uploadedFile.type === 'text/csv') {
        const text = await uploadedFile.text();
        data = parseCSV(text);
      } else if (uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls')) {
        // Carregar SheetJS dinamicamente via CDN
        setProgress(20);
        
        if (!window.XLSX) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Falha ao carregar biblioteca Excel'));
            document.head.appendChild(script);
          });
        }
        
        setProgress(35);
        
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
        
        // Pegar a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para array de arrays
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        setProgress(45);
        
        if (jsonData.length > 0) {
          setHeaders(jsonData[0]);
          data = jsonData;
        }
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
      }
      
      if (data.length > 0) {
        setHeaders(data[0]);
        setRawData(data.slice(1));
        setProgress(50);
        
        // Log do upload
        await base44.entities.LogSistema.create({
          tipo_acao: 'upload_potenciais_condominios',
          usuario_email: (await base44.auth.me()).email,
          usuario_nome: (await base44.auth.me()).full_name,
          descricao: `Upload de arquivo: ${uploadedFile.name} (${data.length - 1} linhas)`,
          timestamp: new Date().toISOString(),
          sucesso: true
        });
        
        await loadHistory();
        processData(data.slice(1));
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao processar arquivo. Tente novamente.");
      setProcessing(false);
    }
  };

  const processData = (data = rawData) => {
    setProcessing(true);
    setProgress(60);
    
    // Coluna M = índice 12 (0-based)
    const columnMIndex = 12;
    
    const addresses = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const fullAddress = row[columnMIndex] || '';
      
      if (fullAddress.trim()) {
        const usefulAddress = extractUsefulAddress(fullAddress);
        const normalized = normalizeAddress(usefulAddress);
        
        if (normalized) {
          addresses.push({
            original: fullAddress,
            useful: usefulAddress,
            normalized,
            rowIndex: i
          });
        }
      }
      
      if (i % 1000 === 0) {
        setProgress(60 + Math.floor((i / data.length) * 30));
      }
    }
    
    setProgress(90);
    
    // Agrupar endereços
    const clusters = clusterAddresses(addresses, threshold, fuzzySensitivity);
    
    setResults(clusters);
    setProgress(100);
    setProcessing(false);
  };

  const handleReprocess = () => {
    if (rawData.length > 0) {
      processData();
    }
  };

  const handleViewRows = (cluster) => {
    setSelectedCluster(cluster);
    setShowRowsModal(true);
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const csvContent = [
      ['Endereço Canônico', 'Quantidade', 'Exemplos'],
      ...results.map(r => [
        r.canonical,
        r.count,
        r.examples.slice(0, 3).join(' | ')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `potenciais_condominios_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportFullData = () => {
    if (rawData.length === 0 || results.length === 0) return;
    
    // Criar mapa de cluster por linha
    const rowClusterMap = {};
    results.forEach((cluster, clusterIndex) => {
      cluster.rows.forEach(rowIndex => {
        rowClusterMap[rowIndex] = {
          canonical: cluster.canonical,
          clusterId: clusterIndex + 1
        };
      });
    });
    
    const csvContent = [
      [...headers, 'canonical_address', 'cluster_id'],
      ...rawData.map((row, index) => {
        const clusterInfo = rowClusterMap[index] || { canonical: '', clusterId: '' };
        return [...row, clusterInfo.canonical, clusterInfo.clusterId];
      })
    ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_completos_clusters_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-600" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Esta página é exclusiva para Admin Master.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Potenciais Condomínios</h1>
              <p className="text-sm text-gray-600">Identifique endereços com alta concentração</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="gap-2"
          >
            <History className="w-4 h-4" />
            Histórico
          </Button>
        </div>

        {/* Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">
                  {file ? file.name : 'Clique para selecionar um arquivo'}
                </p>
                <p className="text-sm text-gray-400">CSV ou Excel (.xlsx) - Máximo 20MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {file && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Arquivo carregado: {file.name}
                </div>
              )}
              
              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                    <span className="text-sm text-gray-600">Processando...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        {rawData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Agrupamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Threshold de Contagem: {threshold}</Label>
                  <Slider
                    value={[threshold]}
                    onValueChange={([val]) => setThreshold(val)}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Mostrar apenas endereços com {threshold}+ ocorrências
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label>Sensibilidade Fuzzy: {fuzzySensitivity}%</Label>
                  <Slider
                    value={[fuzzySensitivity]}
                    onValueChange={([val]) => setFuzzySensitivity(val)}
                    min={50}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Similaridade mínima para agrupar endereços
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleReprocess}
                  disabled={processing}
                  className="gap-2 bg-yellow-600 hover:bg-yellow-700"
                >
                  <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                  Reprocessar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={exportResults}
                  disabled={results.length === 0}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Resumo
                </Button>
                
                <Button
                  variant="outline"
                  onClick={exportFullData}
                  disabled={results.length === 0}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Dados Completos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Resultados ({results.length} clusters encontrados)</span>
                <Badge variant="secondary">
                  {results.reduce((sum, r) => sum + r.count, 0)} linhas agrupadas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Endereço Canônico</TableHead>
                      <TableHead>Exemplos Originais</TableHead>
                      <TableHead className="text-center w-[100px]">Contagem</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((cluster, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {cluster.canonical}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {cluster.examples.slice(0, 3).map((ex, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {ex.length > 40 ? ex.substring(0, 40) + '...' : ex}
                              </Badge>
                            ))}
                            {cluster.examples.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{cluster.examples.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {cluster.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewRows(cluster)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Ver linhas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem vazia */}
        {!processing && rawData.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum arquivo carregado
              </h3>
              <p className="text-gray-500">
                Faça upload de um arquivo CSV ou Excel para começar a análise
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal Ver Linhas */}
        <Dialog open={showRowsModal} onOpenChange={setShowRowsModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Linhas do Cluster: {selectedCluster?.canonical}
              </DialogTitle>
            </DialogHeader>
            
            {selectedCluster && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Total de {selectedCluster.count} ocorrências
                </p>
                
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Endereço Original</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCluster.rows.map((rowIndex, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-sm">
                            {rowIndex + 2}
                          </TableCell>
                          <TableCell>
                            {selectedCluster.examples[i] || rawData[rowIndex]?.[12] || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Histórico */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Uploads</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {uploadHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum upload registrado
                </p>
              ) : (
                uploadHistory.map((log, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.descricao}</p>
                      <p className="text-xs text-gray-500">
                        {log.usuario_nome} • {format(new Date(log.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}