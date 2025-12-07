import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Send, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { ChecklistTemplate, ChatMessage, MessageSender, InspectionReport, User } from '../types';
import { Button } from './Button';
import { generateNextQuestion, generateReportSummary } from '../services/geminiService';
import { saveReport } from '../services/storageService';

interface InspectionChatProps {
  template: ChecklistTemplate;
  currentUser: User;
  onClose: () => void;
  onComplete: () => void;
}

export const InspectionChat: React.FC<InspectionChatProps> = ({ template, currentUser, onClose, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = (text: string, sender: MessageSender) => {
    const msg: ChatMessage = {
      id: uuidv4(),
      sender,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleStart = () => {
    setStarted(true);
    addMessage(`Olá ${currentUser.name}. Iniciando o checklist: ${template.title}.`, MessageSender.AI);
    triggerNextStep(0);
  };

  const triggerNextStep = async (stepIndex: number) => {
    if (stepIndex >= template.items.length) {
      // Finished
      setIsFinishing(true);
      addMessage("Inspeção finalizada! Estou gerando o relatório...", MessageSender.AI);
      
      const { summary, issuesFound } = await generateReportSummary(
        template.title, 
        currentUser.name, 
        messages
      );

      const report: InspectionReport = {
        id: uuidv4(),
        templateId: template.id,
        templateTitle: template.title,
        technicianName: currentUser.name,
        technicianId: currentUser.id,
        date: new Date().toISOString(),
        chatHistory: messages,
        summary,
        status: 'COMPLETED',
        issuesFound
      };
      
      saveReport(report);
      onComplete();
      return;
    }

    setIsTyping(true);
    const item = template.items[stepIndex];
    const question = await generateNextQuestion(template.title, item, messages);
    setIsTyping(false);
    addMessage(question, MessageSender.AI);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = inputText;
    setInputText('');
    addMessage(userMsg, MessageSender.USER);

    // Proceed to next step
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    
    // Tiny delay for natural feel
    setTimeout(() => {
      triggerNextStep(nextIndex);
    }, 500);
  };

  if (!started) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-blue-100 p-4 rounded-full inline-block text-blue-600">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Iniciar Inspeção</h2>
          <p className="text-slate-600">Checklist: <span className="font-semibold">{template.title}</span></p>
          
          <div className="bg-slate-50 p-4 rounded-lg text-left border border-slate-200">
             <p className="text-sm text-slate-500 mb-1">Técnico Responsável</p>
             <p className="font-medium text-slate-900">{currentUser.name}</p>
             <p className="text-xs text-slate-400 mt-1">{currentUser.email}</p>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
            <Button onClick={handleStart} fullWidth>Começar Agora</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={onClose} className="mr-3 text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">{template.title}</h3>
            <p className="text-xs text-slate-500">
              Passo {Math.min(currentStepIndex + 1, template.items.length)} de {template.items.length}
            </p>
          </div>
        </div>
        <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${((currentStepIndex) / template.items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === MessageSender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                msg.sender === MessageSender.USER 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <span className={`text-[10px] mt-1 block opacity-70 ${msg.sender === MessageSender.USER ? 'text-blue-100' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {isFinishing && (
           <div className="flex justify-center py-4">
             <div className="flex items-center text-blue-600 text-sm font-medium animate-pulse">
               <div className="mr-2">Gerando Relatório e Formato WhatsApp...</div>
             </div>
           </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-200 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isFinishing && handleSendMessage()}
            placeholder={isFinishing ? "Finalizando..." : "Digite sua resposta..."}
            disabled={isTyping || isFinishing}
            className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping || isFinishing}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};