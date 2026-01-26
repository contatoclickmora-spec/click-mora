import React, { useState } from 'react';
import { Entregador } from '@/entities/Entregador';
import { RegistroEntrega } from '@/entities/RegistroEntrega';
import { User } from '@/entities/User';
import { UploadFile } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Save, Search, UserX, Loader2, Camera, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NovoRegistroModal({ onClose, onSave, entregadoresExistentes, condominioId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntregador, setSelectedEntregador] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    origem: '',
    telefone: '',
    documento: '',
    placa_veiculo: '',
    quantidade_pacotes: '', // ✅ VAZIO POR PADRÃO
    fotos: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewPhotos, setPreviewPhotos] = useState([]);

  const filteredEntregadores = searchTerm
    ? entregadoresExistentes.filter(e => 
        (e.nome && e.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (e.documento && e.documento.includes(searchTerm))
      )
    : [];

  const handleSelectEntregador = (entregador) => {
    setSelectedEntregador(entregador);
    setFormData({
      nome: entregador.nome || '',
      origem: entregador.origem || '',
      telefone: entregador.telefone || '',
      documento: entregador.documento || '',
      placa_veiculo: entregador.placa_veiculo || '',
      quantidade_pacotes: '', // ✅ SEMPRE VAZIO PARA NOVO REGISTRO
      fotos: [],
    });
    setPreviewPhotos([]);
    setSearchTerm('');
    setError('');
  };

  const handleClearSelection = () => {
    setSelectedEntregador(null);
    setFormData({
      nome: '',
      origem: '',
      telefone: '',
      documento: '',
      placa_veiculo: '',
      quantidade_pacotes: '',
      fotos: [],
    });
    setPreviewPhotos([]);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      const onlyNums = value.replace(/[^\d]/g, '');
      let formatted = '';
      if (onlyNums.length > 0) {
        formatted = '(' + onlyNums.substring(0, 2);
      }
      if (onlyNums.length > 2) {
        formatted += ') ' + onlyNums.substring(2, 7);
      }
      if (onlyNums.length > 7) {
        formatted += '-' + onlyNums.substring(7, 11);
      }
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...files] }));
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewPhotos(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
    setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    
    // ✅ VALIDAÇÃO: verificar quantidade de pacotes
    if (!formData.quantidade_pacotes || Number(formData.quantidade_pacotes) < 1) {
      setError("Por favor, informe a quantidade de pacotes.");
      return;
    }

    // ✅ VALIDAÇÃO MÍNIMA: Apenas verificar se tem pelo menos um nome OU origem
    if (!formData.nome.trim() && !formData.origem.trim()) {
      setError("Por favor, preencha pelo menos o nome do entregador ou a empresa/origem.");
      return;
    }

    if (!condominioId) {
      setError("Erro: Condomínio não identificado. Entre em contato com o suporte.");
      return;
    }

    setSubmitting(true);
    try {
      let entregadorId = selectedEntregador?.id;

      // ✅ Se não selecionou um entregador existente, criar um novo
      if (!selectedEntregador) {
        console.log("📝 Criando novo entregador...");
        
        const novoEntregador = await Entregador.create({
          nome: formData.nome.trim() || "Não informado",
          origem: formData.origem.trim() || "Não informada",
          telefone: formData.telefone.trim() || "",
          documento: formData.documento.trim() || "",
          placa_veiculo: formData.placa_veiculo.trim() || "",
          condominio_id: condominioId
        });
        
        entregadorId = novoEntregador.id;
        console.log("✅ Entregador criado:", entregadorId);
      } else {
        // ✅ ATUALIZAR dados do entregador existente (caso tenha sido editado)
        console.log("🔄 Atualizando dados do entregador existente...");
        await Entregador.update(entregadorId, {
          nome: formData.nome.trim() || selectedEntregador.nome,
          origem: formData.origem.trim() || selectedEntregador.origem,
          telefone: formData.telefone.trim() || selectedEntregador.telefone,
          documento: formData.documento.trim() || selectedEntregador.documento,
          placa_veiculo: formData.placa_veiculo.trim() || selectedEntregador.placa_veiculo
        });
        console.log("✅ Dados do entregador atualizados");
      }

      // ✅ Upload de fotos (se houver)
      let fotoUrls = [];
      if (formData.fotos.length > 0) {
        console.log("📸 Fazendo upload de fotos...");
        const uploadedFiles = await Promise.all(
          formData.fotos.map(file => UploadFile({ file }))
        );
        fotoUrls = uploadedFiles.map(f => f.file_url);
        console.log("✅ Fotos enviadas:", fotoUrls);
      }

      // ✅ Buscar usuário atual
      const currentUser = await User.me();

      // ✅ Criar registro de entrega
      console.log("📦 Criando registro de entrega...");
      await RegistroEntrega.create({
        entregador_id: entregadorId,
        quantidade_pacotes: Number(formData.quantidade_pacotes),
        fotos_encomendas: fotoUrls,
        porteiro_responsavel: currentUser.full_name || "Porteiro",
        data_registro: new Date().toISOString(),
        condominio_id: condominioId
      });

      console.log("✅ Entrega registrada com sucesso!");
      onSave();

    } catch (err) {
      console.error("❌ Erro ao registrar entrega:", err);
      setError(`Erro ao registrar a entrega: ${err.message || 'Verifique os dados e tente novamente.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isExisting = !!selectedEntregador;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="max-h-[90vh] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registrar Entrega</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-y-auto space-y-4">
            
            {/* --- BUSCA --- */}
            <div className="space-y-2">
              <Label>Buscar Entregador Cadastrado</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input placeholder="Buscar por nome ou documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              {searchTerm && (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {filteredEntregadores.length > 0 ? filteredEntregadores.map(e => (
                    <div key={e.id} onClick={() => handleSelectEntregador(e)} className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                      <p className="font-semibold">{e.nome}</p>
                      <p className="text-sm text-gray-500">{e.origem} {e.documento && `- ${e.documento}`}</p>
                    </div>
                  )) : (
                    <p className="p-3 text-sm text-gray-500 text-center">Nenhum entregador encontrado.</p>
                  )}
                </div>
              )}
            </div>

            {isExisting && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                <div className="flex justify-between items-center">
                  <div>
                    <AlertDescription>
                      Registrando nova entrega para <strong>{selectedEntregador.nome}</strong>. Os dados podem ser atualizados se necessário.
                    </AlertDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-blue-600 hover:bg-blue-100">
                    <UserX className="w-4 h-4 mr-1"/> Limpar
                  </Button>
                </div>
              </Alert>
            )}

            {/* --- FORMULÁRIO --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="nome">Nome do Entregador</Label>
                <Input 
                  id="nome"
                  name="nome" 
                  value={formData.nome} 
                  onChange={handleInputChange} 
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <Label htmlFor="origem">Empresa/Origem</Label>
                <Input 
                  id="origem"
                  name="origem" 
                  value={formData.origem} 
                  onChange={handleInputChange} 
                  placeholder="Ex: Correios, Amazon"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone"
                  name="telefone" 
                  value={formData.telefone} 
                  onChange={handleInputChange} 
                  maxLength="15"
                  placeholder="(11) 91234-5678"
                />
              </div>
              <div>
                <Label htmlFor="documento">Documento</Label>
                <Input 
                  id="documento"
                  name="documento" 
                  value={formData.documento} 
                  onChange={handleInputChange} 
                  placeholder="RG, CPF, CNH"
                />
              </div>
              <div>
                <Label htmlFor="placa">Placa do Veículo (Opcional)</Label>
                <Input 
                  id="placa"
                  name="placa_veiculo" 
                  value={formData.placa_veiculo} 
                  onChange={handleInputChange} 
                  placeholder="ABC-1234"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="quantidade">Quantidade de Pacotes</Label>
                <Input 
                  id="quantidade"
                  type="number" 
                  name="quantidade_pacotes" 
                  value={formData.quantidade_pacotes} 
                  onChange={handleInputChange} 
                  min="1"
                  placeholder="Digite a quantidade"
                />
              </div>
            </div>

            <div>
              <Label>Foto(s) das Encomendas</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Adicionar fotos</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handlePhotoUpload} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Permitido múltiplas imagens</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {previewPhotos.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt="preview" className="h-20 w-20 object-cover rounded-md" />
                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removePhoto(index)}><Trash2 className="h-3 w-3"/></Button>
                  </div>
                ))}
              </div>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSubmit} disabled={submitting} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Registrar Entrega
              </Button>
            </div>
            
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}