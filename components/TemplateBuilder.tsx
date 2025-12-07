import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { ChecklistTemplate, ChecklistItem } from '../types';
import { Button } from './Button';
import { saveTemplate } from '../services/storageService';

interface TemplateBuilderProps {
  onCancel: () => void;
  onSave: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ onCancel, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([{ id: uuidv4(), text: '' }]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), text: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, text: string) => {
    const newItems = items.map(item => item.id === id ? { ...item, text } : item);
    setItems(newItems);
  };

  const handleSave = () => {
    if (!title.trim()) return alert('Por favor, dê um título ao checklist.');
    const validItems = items.filter(i => i.text.trim() !== '');
    if (validItems.length === 0) return alert('Adicione pelo menos um item ao checklist.');

    const newTemplate: ChecklistTemplate = {
      id: uuidv4(),
      title,
      description,
      items: validItems,
      createdAt: new Date().toISOString()
    };

    saveTemplate(newTemplate);
    onSave();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <button onClick={onCancel} className="mr-4 p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Novo Checklist</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título do Checklist</label>
          <input
            type="text"
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ex: Manutenção Preventiva Empilhadeira"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
          <textarea
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Breve descrição do procedimento..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Itens de Verificação</label>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-2">
                <span className="py-2 text-slate-400 font-mono text-sm">{index + 1}.</span>
                <input
                  type="text"
                  className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="O que deve ser verificado?"
                  value={item.text}
                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                />
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  disabled={items.length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={handleAddItem} className="mt-4">
            <Plus size={16} className="mr-1" /> Adicionar Item
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSave}>
            <Save size={18} className="mr-2" /> Salvar Checklist
          </Button>
        </div>
      </div>
    </div>
  );
};
