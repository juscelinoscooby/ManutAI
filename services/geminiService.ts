import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChecklistItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

export const generateNextQuestion = async (
  templateTitle: string,
  currentItem: ChecklistItem,
  previousContext: ChatMessage[]
): Promise<string> => {
  const systemInstruction = `
    Você é um supervisor de manutenção experiente e educado.
    Você está guiando um técnico através de um checklist de manutenção: "${templateTitle}".
    O item atual que precisa ser verificado é: "${currentItem.text}".

    Seu objetivo:
    1. Pergunte ao técnico sobre o status deste item específico.
    2. Seja conciso e direto, mas cordial.
    3. Se o histórico mostrar que o usuário relatou um problema no item anterior, reconheça brevemente antes de passar para o atual.
    4. Fale sempre em Português do Brasil.
  `;

  // Filter messages to avoid context overflow if chat is huge, though usually manageable.
  // We format history for context.
  const historyText = previousContext
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');

  const prompt = `
    Histórico da conversa:
    ${historyText}

    Item atual do checklist: ${currentItem.text}

    Gere a próxima pergunta para o técnico verificar este item.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || `Por favor, verifique o item: ${currentItem.text}. Está tudo OK?`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Verifique o item: ${currentItem.text}. Digite a situação.`;
  }
};

export const generateReportSummary = async (
  templateTitle: string,
  technicianName: string,
  chatHistory: ChatMessage[]
): Promise<{ summary: string, whatsappText: string, issuesFound: boolean }> => {
  const historyText = chatHistory
    .map(msg => `${msg.sender}: ${msg.text}`)
    .join('\n');

  const prompt = `
    Analise a seguinte conversa de inspeção de manutenção para o checklist "${templateTitle}" realizada por ${technicianName}.

    Histórico:
    ${historyText}

    Tarefas:
    1. Crie um resumo técnico profissional (max 100 palavras) destacando o que foi verificado e quaisquer problemas encontrados.
    2. Crie uma mensagem formatada para WhatsApp (use emojis, quebras de linha) pronta para enviar ao gestor. A mensagem de WhatsApp deve ser clara, listar itens críticos e problemas.
    3. Determine se houve algum problema/falha relatado (true/false).

    Retorne APENAS um JSON neste formato:
    {
      "summary": "texto do resumo...",
      "whatsappText": "texto formatado...",
      "issuesFound": boolean
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return {
      summary: "Não foi possível gerar o resumo via IA. Verifique o histórico completo.",
      whatsappText: `*Relatório de Manutenção*\n\nTécnico: ${technicianName}\nChecklist: ${templateTitle}\n\nPor favor, consulte o sistema para detalhes completos.`,
      issuesFound: false
    };
  }
};
