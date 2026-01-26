import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

export default function SignaturePad({ onSave }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [context, setContext] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Ajustar tamanho do canvas para tela
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            const ctx = canvas.getContext("2d");
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            setContext(ctx);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    const getCoordinates = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Suporte para mouse
        if (event.type.includes('mouse')) {
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
        
        // Suporte para touch
        if (event.type.includes('touch')) {
            const touch = event.touches[0] || event.changedTouches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
        
        return { x: 0, y: 0 };
    };

    const startDrawing = (event) => {
        event.preventDefault();
        if (!context) return;
        
        const { x, y } = getCoordinates(event);
        
        context.beginPath();
        context.moveTo(x, y);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (event) => {
        event.preventDefault();
        if (!isDrawing || !context) return;
        
        const { x, y } = getCoordinates(event);
        
        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = (event) => {
        event.preventDefault();
        if (!context) return;
        
        context.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        if (!context) return;
        
        const canvas = canvasRef.current;
        context.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        if (!hasSignature) {
            alert('Por favor, desenhe sua assinatura antes de salvar.');
            return;
        }

        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log('✏️ [ASSINATURA] Capturada com sucesso:', dataUrl.substring(0, 50) + '...');
        
        onSave(dataUrl);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="border-2 border-dashed border-gray-300 rounded-lg w-full h-48 touch-none bg-white cursor-crosshair"
                    style={{ touchAction: 'none' }}
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">
                            Desenhe sua assinatura aqui
                        </p>
                    </div>
                )}
            </div>
            
            <div className="flex gap-2">
                <Button 
                    type="button"
                    variant="outline" 
                    onClick={clearCanvas} 
                    className="flex-1 h-12"
                    disabled={!hasSignature}
                >
                    <Trash2 className="w-4 h-4 mr-2" /> 
                    Limpar
                </Button>
                <Button 
                    type="button"
                    onClick={handleSave} 
                    className="flex-1 h-12 bg-[#3b5998] hover:bg-[#2d4373]"
                    disabled={!hasSignature}
                >
                    <Save className="w-4 h-4 mr-2" /> 
                    Salvar Assinatura
                </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Use o dedo (em dispositivos móveis) ou o mouse (em computadores) para desenhar sua assinatura no campo acima.
                </p>
            </div>
        </div>
    );
}