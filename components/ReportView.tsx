import React, { useState, useEffect } from 'react';
import { Share2, ArrowLeft, Calendar, User, AlertTriangle, CheckCircle, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { InspectionReport } from '../types';
import { Button } from './Button';

interface ReportViewProps {
  report: InspectionReport;
  onClose: () => void;
}

// Utility to remove emojis for PDF compatibility (Standard PDF fonts don't support color emojis)
const stripEmojis = (str: string) => {
  return str
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .trim();
};

export const ReportView: React.FC<ReportViewProps> = ({ report, onClose }) => {
  const [whatsappText, setWhatsappText] = useState('');
  const [loadingWa, setLoadingWa] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const prepareWhatsapp = async () => {
      setLoadingWa(true);
      const formattedDate = new Date(report.date).toLocaleDateString();
      const text = `🛠️ *RELATÓRIO DE MANUTENÇÃO*\n\n` +
        `📋 *Checklist:* ${report.templateTitle}\n` +
        `👤 *Técnico:* ${report.technicianName}\n` +
        `📅 *Data:* ${formattedDate}\n\n` +
        `📝 *Resumo:*\n${report.summary}\n\n` +
        `⚠️ *Status:* ${report.issuesFound ? 'Problemas Identificados' : 'Tudo OK'}\n\n` +
        `_Gerado via ManutAI_`;
      
      setWhatsappText(text);
      setLoadingWa(false);
    };
    
    prepareWhatsapp();
  }, [report]);

  const handleShareWhatsapp = () => {
    const encoded = encodeURIComponent(whatsappText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownloadPDF = () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = 20;

      // --- Header ---
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ManutAI - Relatório de Inspeção", margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`ID: ${report.id.substring(0, 8)}`, margin, yPos);

      // --- Info Box ---
      yPos += 15;
      doc.setDrawColor(200);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin, yPos, pageWidth - (margin * 2), 35, 'FD');

      yPos += 8;
      doc.setFontSize(11);
      doc.setTextColor(0);
      
      // Checklist Title
      doc.setFont("helvetica", "bold");
      doc.text("Checklist:", margin + 5, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(stripEmojis(report.templateTitle), margin + 30, yPos);
      
      // Tech
      yPos += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Técnico:", margin + 5, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(stripEmojis(report.technicianName), margin + 30, yPos);

      // Date
      yPos += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Data:", margin + 5, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(report.date).toLocaleString(), margin + 30, yPos);

      // Status
      yPos += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Status:", margin + 5, yPos);
      doc.setTextColor(report.issuesFound ? 220 : 0, report.issuesFound ? 50 : 150, 0); // Red or Greenish
      doc.text(report.issuesFound ? "ATENÇÃO NECESSÁRIA" : "APROVADO", margin + 30, yPos);
      doc.setTextColor(0); // Reset color

      yPos += 20;

      // --- AI Summary ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo da Inspeção", margin, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitSummary = doc.splitTextToSize(stripEmojis(report.summary), pageWidth - (margin * 2));
      doc.text(splitSummary, margin, yPos);
      
      yPos += (splitSummary.length * 5) + 15;

      // --- Chat History ---
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Histórico Detalhado", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      
      report.chatHistory.forEach((msg) => {
        // Check for page break
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }

        const isUser = msg.sender === 'USER';
        const senderName = isUser ? report.technicianName : "ManutAI";
        const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Sender Header
        doc.setFont("helvetica", "bold");
        doc.setTextColor(isUser ? 0 : 80, isUser ? 0 : 80, isUser ? 150 : 80); // Blue for user, Grey for AI
        doc.text(`${senderName} (${time})`, margin, yPos);
        yPos += 5;

        // Message Body
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        const cleanText = stripEmojis(msg.text);
        const splitText = doc.splitTextToSize(cleanText, pageWidth - (margin * 2));
        doc.text(splitText, margin, yPos);
        
        yPos += (splitText.length * 5) + 8; // Spacing for next message
      });

      // Save
      doc.save(`relatorio_${report.templateTitle.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);

    } catch (error) {
      console.error("PDF Gen Error:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex items-center shadow-md">
        <button onClick={onClose} className="mr-4 hover:bg-slate-800 p-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold">Detalhes do Relatório</h2>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{report.templateTitle}</h1>
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-500">
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    {report.technicianName}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    {new Date(report.date).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium ${
                report.issuesFound ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                {report.issuesFound ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                <span className="hidden sm:inline">{report.issuesFound ? 'Atenção Necessária' : 'Aprovado'}</span>
              </div>
            </div>
          </div>

          {/* AI Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
              <FileText className="mr-2 text-blue-600" size={20} /> Resumo da IA
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg text-slate-700 leading-relaxed border border-slate-200">
              {report.summary}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
             <Button 
               variant="primary" 
               size="lg" 
               className="bg-[#25D366] hover:bg-[#128C7E] text-white flex-1 shadow-md"
               onClick={handleShareWhatsapp}
               disabled={loadingWa}
             >
               <Share2 className="mr-2" size={20} />
               {loadingWa ? 'Preparando...' : 'Enviar no WhatsApp'}
             </Button>

             <Button 
               variant="secondary" 
               size="lg" 
               className="flex-1 shadow-md"
               onClick={handleDownloadPDF}
               disabled={generatingPdf}
             >
               <Download className="mr-2" size={20} />
               {generatingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
             </Button>
          </div>

          {/* Chat Transcript */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Histórico da Conversa</h3>
            <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
              {report.chatHistory.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'AI' ? 'items-start' : 'items-end'}`}>
                  <span className="text-xs text-slate-400 mb-1 font-bold">{msg.sender === 'USER' ? report.technicianName : 'ManutAI'}</span>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === 'AI' ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-800'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};