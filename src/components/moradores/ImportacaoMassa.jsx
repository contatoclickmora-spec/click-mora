import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Info,
  Eye,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function ImportacaoMassa({ condominioId, onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState({ headers: [], rows: [], allRows: [] });
  const [columnMapping, setColumnMapping] = useState({});
  const [resultado, setResultado] = useState({
    total: 0,
    sucesso: 0,
    ignorados: 0,
    erros: [],
    moradoresImportados: []
  });

  const downloadTemplate = () => {
    const headers = ['Nome completo', 'Endereço', 'Complemento', 'Abreviação', 'Telefone', 'E-mail'];
    const exemplos = [
      ['João da Silva', 'Bloco 9', 'Apto 103', '9-103', '11987654321', 'joao@email.com'],
      ['Maria Santos', 'Torre A', 'Casa 25', 'A-25', '11999888777', 'maria@email.com'],
      ['Pedro Costa', 'beco rosa 100A', 'Portão Azul', 'BR100A', '11988776655', 'pedro@email.com'],
      ['Ana Paula', 'Rua das Flores s/n', 'Fundos', '', '21987654321', 'ana@email.com']
    ];
    
    const csvContent = [
      headers.join(','),
      ...exemplos.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_moradores.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const normalizeHeader = (text) => {
    if (!text) return '';
    return String(text)
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');
  };

  const autoMapColumns = (headers) => {
    const mapping = {};
    const aliases = {
      nome: ['nome', 'nome completo', 'nomecompleto', 'name'],
      endereco: ['endereco', 'endereço', 'endereco principal', 'endereço principal', 'address', 'rua'],
      complemento: ['complemento', 'complement', 'compl'],
      abreviacao: ['abreviacao', 'abreviação', 'apelido', 'atalho'],
      telefone: ['telefone', 'fone', 'celular', 'contato', 'phone', 'whatsapp'],
      email: ['email', 'e-mail', 'mail', 'correio']
    };

    headers.forEach((header, index) => {
      const normalized = normalizeHeader(header);
      
      for (const [field, variations] of Object.entries(aliases)) {
        if (variations.some(v => normalized.includes(v) || v.includes(normalized))) {
          mapping[field] = index;
          break;
        }
      }
    });

    return mapping;
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 1) return { headers: [], rows: [] };

    const parseRow = (line) => {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      return values.map(v => v.replace(/^["']|["']$/g, '').trim());
    };

    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(line => parseRow(line));

    return { headers, rows };
  };

  const validarEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const validarTelefone = (telefone) => {
    if (!telefone) return false;
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 15;
  };

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // VALIDAÇÃO: Formato de arquivo
    const ext = uploadedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'ods'].includes(ext)) {
      alert('Formato inválido. Use .csv, .xlsx, .xls ou .ods');
      return;
    }

    // VALIDAÇÃO: Tamanho do arquivo
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (uploadedFile.size > maxSize) {
      alert(`Arquivo muito grande (${(uploadedFile.size / 1024 / 1024).toFixed(1)}MB). Tamanho máximo: 10MB`);
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      const text = await uploadedFile.text();
      
      // VALIDAÇÃO: Arquivo vazio
      if (!text || text.trim().length === 0) {
        throw new Error('Arquivo vazio');
      }

      const { headers, rows } = parseCSV(text);

      // VALIDAÇÃO: Estrutura mínima
      if (headers.length < 1) {
        throw new Error('Planilha deve ter pelo menos 1 coluna');
      }

      if (rows.length === 0) {
        throw new Error('Planilha não contém dados (apenas cabeçalho)');
      }

      // VALIDAÇÃO: Limite de linhas (performance)
      if (rows.length > 1000) {
        if (!confirm(`A planilha contém ${rows.length} linhas. Importações grandes podem demorar vários minutos. Recomendamos dividir em arquivos menores. Continuar?`)) {
          setLoading(false);
          return;
        }
      }

      const mapping = autoMapColumns(headers);
      const previewRows = rows.slice(0, 5);

      setPreviewData({ headers, rows: previewRows, allRows: rows });
      setColumnMapping(mapping);
      setStep(2);

    } catch (error) {
      console.error('[DATA_INTEGRITY] Erro ao ler arquivo:', error);
      alert(`Erro ao ler arquivo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processarImportacao = async () => {
    // VALIDAÇÃO: Dados disponíveis
    if (!previewData || !previewData.allRows || previewData.allRows.length === 0) {
      alert('Nenhum dado para importar');
      return;
    }

    // VALIDAÇÃO: Colunas obrigatórias mapeadas
    if (columnMapping.nome === undefined || columnMapping.telefone === undefined || columnMapping.email === undefined || columnMapping.endereco === undefined) {
      alert('Por favor, mapeie as colunas obrigatórias: Nome, Endereço, Telefone e E-mail antes de importar.');
      return;
    }

    // VALIDAÇÃO: Limite de linhas (performance)
    if (previewData.allRows.length > 500) {
      if (!confirm(`Você está importando ${previewData.allRows.length} linhas. Isso pode demorar alguns minutos. Continuar?`)) {
        return;
      }
    }

    setStep(3);
    setLoading(true);

    const erros = [];
    let sucessos = 0;
    let ignorados = 0;
    const moradoresValidos = [];
    const emailsProcessados = new Set();

    for (let i = 0; i < previewData.allRows.length; i++) {
      const linha = i + 2;
      const row = previewData.allRows[i];

      try {
        // SANITIZAÇÃO: Limpar e limitar tamanhos
        const nome = String(row[columnMapping.nome] || '').trim().slice(0, 200);
        const endereco = String(row[columnMapping.endereco] || '').trim().slice(0, 300);
        const complemento = String(row[columnMapping.complemento] || '').trim().slice(0, 200);
        const abreviacao = String(row[columnMapping.abreviacao] || '').trim().slice(0, 50);
        const telefoneRaw = String(row[columnMapping.telefone] || '').trim();
        const emailRaw = String(row[columnMapping.email] || '').trim().toLowerCase();

        // VALIDAÇÃO: Campos obrigatórios
        if (!nome || !endereco || !telefoneRaw || !emailRaw) {
          erros.push({ linha, motivo: 'Campos obrigatórios vazios (Nome, Endereço, Telefone ou E-mail)' });
          ignorados++;
          continue;
        }

        // VALIDAÇÃO: Tamanho mínimo do nome
        if (nome.length < 3) {
          erros.push({ linha, motivo: `Nome muito curto: ${nome}` });
          ignorados++;
          continue;
        }

        // SANITIZAÇÃO: Telefone - apenas dígitos
        const telefone = telefoneRaw.replace(/\D/g, '').slice(0, 11);
        
        if (!validarTelefone(telefone)) {
          erros.push({ linha, motivo: `Telefone inválido: ${telefoneRaw}` });
          ignorados++;
          continue;
        }

        // VALIDAÇÃO: Email
        const email = emailRaw.slice(0, 100);
        
        if (!validarEmail(email)) {
          erros.push({ linha, motivo: `E-mail inválido: ${email}` });
          ignorados++;
          continue;
        }

        // VALIDAÇÃO: Duplicidade de email na planilha
        if (emailsProcessados.has(email)) {
          erros.push({ linha, motivo: `E-mail duplicado na planilha: ${email}` });
          ignorados++;
          continue;
        }

        // VALIDAÇÃO: Condomínio deve existir
        if (!condominioId) {
          erros.push({ linha, motivo: 'Erro de segurança: Condomínio não identificado' });
          ignorados++;
          continue;
        }

        emailsProcessados.add(email);
        moradoresValidos.push({
          nome,
          endereco,
          complemento,
          abreviacao: abreviacao || endereco.slice(0, 20),
          telefone,
          email,
          condominio_id: condominioId,
          tipo_usuario: 'morador',
          status: 'ativo'
        });
        sucessos++;

      } catch (error) {
        console.error(`[DATA_INTEGRITY] Erro na linha ${linha}:`, error);
        erros.push({ linha, motivo: error.message || 'Erro ao processar linha' });
        ignorados++;
      }
    }

    // PROTEÇÃO: Salvar moradores em lotes para performance
    try {
      if (moradoresValidos.length > 0) {
        console.log(`[IMPORTAÇÃO] Salvando ${moradoresValidos.length} moradores...`);
        
        const BATCH_SIZE = 10;
        let processados = 0;
        
        for (let i = 0; i < moradoresValidos.length; i += BATCH_SIZE) {
          const batch = moradoresValidos.slice(i, i + BATCH_SIZE);
          
          await Promise.all(batch.map(async (moradorData) => {
            try {
              // VALIDAÇÃO FINAL: Garantir condominio_id
              if (moradorData.condominio_id !== condominioId) {
                throw new Error('SECURITY_BREACH: Condomínio incorreto');
              }
              
              await base44.entities.Morador.create(moradorData);
              processados++;
            } catch (err) {
              console.error('[IMPORTAÇÃO] Erro ao criar morador:', err);
              erros.push({ 
                linha: moradoresValidos.indexOf(moradorData) + 2, 
                motivo: `Erro ao salvar: ${err.message}` 
              });
              sucessos--;
              ignorados++;
            }
          }));
          
          console.log(`[IMPORTAÇÃO] Progresso: ${processados}/${moradoresValidos.length}`);
        }

        console.log(`[IMPORTAÇÃO] ✅ ${sucessos} moradores salvos com sucesso`);
      }
    } catch (err) {
      console.error('[IMPORTAÇÃO] ❌ Erro ao salvar moradores:', err);
      alert('Erro ao salvar moradores no banco de dados.');
    }

    setResultado({
      total: previewData.allRows.length,
      sucesso: sucessos,
      ignorados,
      erros,
      moradoresImportados: moradoresValidos
    });

    setLoading(false);
    setStep(4);
  };

  const confirmarImportacao = () => {
    onSuccess();
  };

  const downloadRelatorio = () => {
    const headers = ['Linha', 'Motivo'];
    const linhas = resultado.erros.map(e => `${e.linha},"${e.motivo}"`);
    
    const csvContent = [
      headers.join(','),
      ...linhas
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_importacao_erros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: Upload */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Upload className="w-6 h-6" />
                Importar Moradores em Massa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>Instruções:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Baixe o modelo de planilha</li>
                    <li>Preencha com os dados dos moradores</li>
                    <li>Exporte como .csv ou .xlsx</li>
                    <li>Faça upload aqui</li>
                  </ol>
                  <p className="mt-3 font-semibold">
                    Preencha a coluna 'Endereço' com o endereço livre (ex: 'beco rosa 100A'). O sistema aceitará o texto como está.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Importante:
                </p>
                <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Use o modelo fornecido</li>
                  <li>Não altere a ordem das colunas</li>
                  <li>Campos obrigatórios: Nome, Endereço, Telefone, E-mail</li>
                  <li>Campo 'Abreviação' é opcional</li>
                  <li>E-mails duplicados *na planilha* serão ignorados</li>
                  <li>Moradores importados ficam ativos automaticamente</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-900"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Baixar Modelo de Planilha
                </Button>

                <div className="relative">
                  <label htmlFor="file-upload" className="block">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700">
                        Clique para selecionar a planilha
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        .csv, .xlsx, .xls ou .ods
                      </p>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.ods"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={onCancel} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* STEP 2: Preview e Mapeamento */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Eye className="w-6 h-6" />
                Preview e Mapeamento de Colunas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              <Alert className="bg-indigo-50 border-indigo-200">
                <Info className="w-4 h-4 text-indigo-600" />
                <AlertDescription className="text-indigo-900 text-sm">
                  Confira se as colunas foram mapeadas corretamente. Você pode ajustar manualmente se necessário.
                </AlertDescription>
              </Alert>

              {/* Mapeamento de Colunas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Mapeamento de Colunas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['nome', 'endereco', 'complemento', 'abreviacao', 'telefone', 'email'].map(field => (
                    <div key={field}>
                      <Label className="text-sm text-gray-700 capitalize">
                        {field === 'endereco' ? 'Endereço' : field === 'abreviacao' ? 'Abreviação' : field}
                        {!['complemento', 'abreviacao'].includes(field) && ' *'}
                      </Label>
                      <Select
                        value={String(columnMapping[field] ?? '')}
                        onValueChange={(value) => setColumnMapping(prev => ({
                          ...prev,
                          [field]: value === '' ? undefined : parseInt(value)
                        }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione a coluna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Nenhuma</SelectItem>
                          {previewData.headers.map((header, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {header || `Coluna ${idx + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview das Primeiras Linhas */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Preview das Primeiras 5 Linhas
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Complemento</TableHead>
                        <TableHead>Abreviação</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>E-mail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row[columnMapping.nome] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.endereco] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.complemento] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.abreviacao] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.telefone] || '-'}</TableCell>
                          <TableCell>{row[columnMapping.email] || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={processarImportacao}
                  disabled={
                    columnMapping.nome === undefined ||
                    columnMapping.endereco === undefined ||
                    columnMapping.telefone === undefined ||
                    columnMapping.email === undefined
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Importar {previewData.allRows?.length || 0} Moradores
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* STEP 3: Processando */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Processando importação...
              </p>
              <p className="text-sm text-gray-500">
                Aguarde enquanto validamos e importamos os dados
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* STEP 4: Relatório */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="w-6 h-6" />
                Relatório de Importação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {resultado.total}
                  </div>
                  <div className="text-sm font-medium text-blue-800">
                    Total de Linhas
                  </div>
                </div>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {resultado.sucesso}
                  </div>
                  <div className="text-sm font-medium text-green-800">
                    Importados
                  </div>
                </div>
                
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {resultado.ignorados}
                  </div>
                  <div className="text-sm font-medium text-red-800">
                    Ignorados
                  </div>
                </div>
              </div>

              {resultado.ignorados > 0 && (
                <Alert variant="destructive" className="bg-red-50">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>{resultado.ignorados} linha(s) ignoradas:</strong>
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
                      {resultado.erros.slice(0, 10).map((erro, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border border-red-200 text-red-700">
                          Linha {erro.linha}: {erro.motivo}
                        </div>
                      ))}
                      {resultado.erros.length > 10 && (
                        <p className="text-xs text-red-700 mt-2">
                          Mais {resultado.erros.length - 10} erro(s) não exibidos. Baixe o relatório completo.
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {resultado.sucesso > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Importação concluída com sucesso!</strong>
                    <p className="text-sm mt-2">
                      {resultado.sucesso} morador(es) foram adicionados ao sistema.
                    </p>
                    <p className="text-sm mt-1">
                      Todos os moradores importados estão ativos e já podem acessar o sistema.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {resultado.ignorados > 0 && (
                  <Button
                    onClick={downloadRelatorio}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Relatório de Erros
                  </Button>
                )}
                <Button
                  onClick={confirmarImportacao}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Concluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}