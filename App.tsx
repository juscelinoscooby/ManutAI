import React, { useState, useEffect } from 'react';
import { ClipboardList, MessageSquare, FileBarChart, PlusCircle, Trash2, ChevronRight, LogOut, Shield, Wrench, Search, Users, Download } from 'lucide-react';
import { AppView, ChecklistTemplate, InspectionReport, User } from './types';
import { TemplateBuilder } from './components/TemplateBuilder';
import { InspectionChat } from './components/InspectionChat';
import { ReportView } from './components/ReportView';
import { LoginView } from './components/LoginView';
import { UserManagement } from './components/UserManagement';
import { Button } from './components/Button';
import { getTemplates, getReports, deleteTemplate, deleteReport, seedInitialAdmin } from './services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  
  // Selection states
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);

  // Filter states
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    seedInitialAdmin(); // Ensure default admin exists

    // PWA Install Prompt Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const loadData = () => {
    setTemplates(getTemplates());
    setReports(getReports());
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [view, currentUser]); 

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      deleteTemplate(id);
      loadData();
    }
  };

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      deleteReport(id);
      loadData();
    }
  };

  const startInspection = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setView(AppView.INSPECTION_CHAT);
  };

  const viewReport = (report: InspectionReport) => {
    setSelectedReport(report);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView(AppView.DASHBOARD);
  };

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Auth Guard
  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  // Render Logic
  const renderContent = () => {
    if (selectedReport) {
      return <ReportView report={selectedReport} onClose={() => setSelectedReport(null)} />;
    }

    switch (view) {
      case AppView.CREATE_TEMPLATE:
        if (currentUser.role !== 'ADMIN') {
          setView(AppView.DASHBOARD);
          return null;
        }
        return (
          <TemplateBuilder 
            onCancel={() => setView(AppView.DASHBOARD)}
            onSave={() => {
              setView(AppView.DASHBOARD);
              loadData();
            }}
          />
        );

      case AppView.USERS:
        if (currentUser.role !== 'ADMIN') {
          setView(AppView.DASHBOARD);
          return null;
        }
        return <UserManagement onClose={() => setView(AppView.DASHBOARD)} />;
      
      case AppView.INSPECTION_CHAT:
        if (!selectedTemplate) {
          setView(AppView.DASHBOARD);
          return null;
        }
        return (
          <InspectionChat 
            template={selectedTemplate}
            currentUser={currentUser}
            onClose={() => {
              setSelectedTemplate(null);
              setView(AppView.DASHBOARD);
            }}
            onComplete={() => {
              setSelectedTemplate(null);
              setView(AppView.REPORTS);
              loadData();
            }}
          />
        );

      case AppView.REPORTS:
        const filteredReports = reports.filter(r => 
          r.templateTitle.toLowerCase().includes(reportSearchTerm.toLowerCase()) || 
          r.technicianName.toLowerCase().includes(reportSearchTerm.toLowerCase())
        );

        return (
          <div className="max-w-4xl mx-auto p-4">
             <div className="flex flex-col md:flex-row md:items-center mb-6 justify-between gap-4">
               <div className="flex items-center">
                 <button onClick={() => setView(AppView.DASHBOARD)} className="mr-4 p-2 rounded-full hover:bg-slate-200">
                    <ClipboardList size={24} />
                 </button>
                 <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerados</h2>
               </div>
               
               <div className="relative w-full md:w-72">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   placeholder="Buscar checklist ou técnico..."
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                   value={reportSearchTerm}
                   onChange={(e) => setReportSearchTerm(e.target.value)}
                 />
               </div>
             </div>

             {filteredReports.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                 <p className="text-slate-500">
                   {reports.length === 0 ? "Nenhum relatório encontrado." : "Nenhum relatório corresponde à busca."}
                 </p>
               </div>
             ) : (
               <div className="grid gap-4">
                 {filteredReports.slice().reverse().map(report => (
                   <div key={report.id} onClick={() => viewReport(report)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group">
                     <div>
                       <h3 className="font-semibold text-lg text-slate-800">{report.templateTitle}</h3>
                       <div className="text-sm text-slate-500 mt-1 flex gap-3">
                         <span>{new Date(report.date).toLocaleDateString()}</span>
                         <span>•</span>
                         <span>{report.technicianName}</span>
                       </div>
                       {report.issuesFound && (
                         <span className="inline-block mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                           ⚠️ Atenção Necessária
                         </span>
                       )}
                     </div>
                     <div className="flex items-center gap-3">
                        {currentUser.role === 'ADMIN' && (
                          <button 
                            onClick={(e) => handleDeleteReport(e, report.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        <ChevronRight className="text-slate-300" />
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        );

      case AppView.DASHBOARD:
      default:
        return (
          <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
            {/* Header with User Info */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">ManutAI</h1>
                <p className="text-slate-500 mt-1">Gestão inteligente de manutenção</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {deferredPrompt && (
                  <button 
                    onClick={handleInstallApp}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition-colors animate-pulse"
                  >
                    <Download size={16} /> Instalar App
                  </button>
                )}

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                  <div className={`p-2 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {currentUser.role === 'ADMIN' ? <Shield size={16} /> : <Wrench size={16} />}
                  </div>
                  <div className="mr-2">
                    <p className="text-sm font-bold text-slate-800 leading-none">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider">{currentUser.role}</p>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="p-2 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-full transition-colors"
                    title="Sair"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setView(AppView.REPORTS)} variant="outline" size="sm">
                <FileBarChart className="mr-2" size={18} /> Histórico de Relatórios
              </Button>
              
              {currentUser.role === 'ADMIN' && (
                <Button onClick={() => setView(AppView.USERS)} variant="outline" size="sm">
                  <Users className="mr-2" size={18} /> Gerenciar Usuários
                </Button>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-400 text-sm font-medium mb-1">Checklists</div>
                <div className="text-2xl font-bold text-slate-800">{templates.length}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-slate-400 text-sm font-medium mb-1">Relatórios</div>
                <div className="text-2xl font-bold text-slate-800">{reports.length}</div>
              </div>
              
              {currentUser.role === 'ADMIN' ? (
                <div className="bg-blue-600 p-4 rounded-xl shadow-sm text-white col-span-2 flex items-center justify-between cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => setView(AppView.CREATE_TEMPLATE)}>
                  <div>
                    <div className="font-bold text-lg">Criar Novo Modelo</div>
                    <div className="text-blue-100 text-sm">Adicione um novo checklist</div>
                  </div>
                  <PlusCircle size={28} />
                </div>
              ) : (
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 col-span-2 flex items-center justify-between opacity-75">
                  <div>
                    <div className="font-bold text-lg text-slate-600">Área do Técnico</div>
                    <div className="text-slate-500 text-sm">Selecione um checklist abaixo para iniciar</div>
                  </div>
                  <Wrench size={28} className="text-slate-400" />
                </div>
              )}
            </div>

            {/* Templates List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Checklists Disponíveis</h2>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                  <ClipboardList size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 mb-4">Nenhum checklist criado ainda.</p>
                  {currentUser.role === 'ADMIN' && (
                    <Button onClick={() => setView(AppView.CREATE_TEMPLATE)}>Criar Primeiro Checklist</Button>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col overflow-hidden group">
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg text-slate-800 line-clamp-2">{template.title}</h3>
                          {currentUser.role === 'ADMIN' && (
                            <button 
                              onClick={(e) => handleDeleteTemplate(e, template.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{template.description || "Sem descrição."}</p>
                        <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-2 rounded-lg w-fit">
                          <ClipboardList size={14} className="mr-1" />
                          {template.items.length} itens de verificação
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button 
                          fullWidth 
                          onClick={() => startInspection(template)}
                          className="justify-between"
                        >
                          Iniciar Inspeção <MessageSquare size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {renderContent()}
    </div>
  );
};

export default App;