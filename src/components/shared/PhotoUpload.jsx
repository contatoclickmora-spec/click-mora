import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PhotoUpload({ 
  currentPhotoUrl, 
  onPhotoChange, 
  label = "Foto de Perfil",
  required = false,
  disabled = false 
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl || null);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        console.log('📷 [PHOTO UPLOAD] Nenhum arquivo selecionado');
        return;
      }

      console.log('📷 [PHOTO UPLOAD] Arquivo:', file.name, file.type, file.size);

      // Validar tipo de arquivo (incluindo HEIC/HEIF para iOS)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(file.type) || ['jpg', 'jpeg', 'png', 'heic', 'heif'].includes(fileExtension || '');
      
      if (!isValidType) {
        setError('Formato inválido. Use apenas JPG, JPEG, PNG ou HEIC.');
        return;
      }

      // Validar tamanho (max 10MB para iOS)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB.');
        return;
      }

      setError('');
      setUploading(true);

      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result);
      };
      reader.onerror = (error) => {
        console.error('❌ [PHOTO UPLOAD] Erro ao ler arquivo:', error);
        setError('Erro ao processar imagem. Tente novamente.');
        setUploading(false);
      };
      reader.readAsDataURL(file);

      // Upload para o servidor
      const result = await base44.integrations.Core.UploadFile({ file });
      
      if (result && result.file_url) {
        onPhotoChange(result.file_url);
        setPreview(result.file_url);
        console.log('✅ [PHOTO UPLOAD] Foto enviada com sucesso:', result.file_url);
      } else {
        throw new Error('URL da foto não retornada');
      }

    } catch (err) {
      console.error('❌ [PHOTO UPLOAD] Erro ao fazer upload:', err);
      setError('Erro ao enviar foto. Tente novamente.');
      setPreview(currentPhotoUrl || null);
    } finally {
      setUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoChange(null);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="photo-upload">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="flex items-center gap-4">
        {/* Preview da foto */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {preview && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Remover foto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex-1 space-y-2">
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
            aria-label="Selecionar foto"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {preview ? 'Alterar Foto' : 'Enviar Foto'}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            Formatos aceitos: JPG, PNG, HEIC (máx. 10MB)
          </p>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Aviso de obrigatoriedade */}
      {required && !preview && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> A foto é obrigatória para concluir o cadastro.
          </p>
        </div>
      )}
    </div>
  );
}