
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedTask, ConversationTurn } from '../types';
// Fix: Import `GenerateContentResponse` and `LiveServerMessage`. Remove unexported `LiveSession`.
import { GoogleGenAI, LiveServerMessage, GenerateContentResponse, Blob, Modality, FunctionDeclaration, Type } from '@google/genai';

interface AiTaskParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tasks: ParsedTask[]) => void;
}

// --- Audio Encoding/Decoding Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const createTasksFunctionDeclaration: FunctionDeclaration = {
  name: 'createTasks',
  parameters: {
    type: Type.OBJECT,
    description: 'Creates one or more tasks based on the user conversation. Use this function to add tasks to the proposed list.',
    properties: {
      tasks: {
        type: Type.ARRAY,
        description: 'A list of tasks to be created.',
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING, description: 'Day of the week in Spanish (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo).' },
            time_slot: { type: Type.STRING, description: 'Time for the task, e.g., "09:00 - 10:00" or "por la tarde".' },
            task_detail: { type: Type.STRING, description: 'A concise description of the task.' },
            category: { type: Type.STRING, description: 'A relevant category for the task (e.g., Reunión, Trabajo, Personal).' },
            status: { type: Type.STRING, description: 'The status of the task. Use "Completed" if the user says they already did it, "In Progress" if they are doing it, or "Pending" if it is for the future. Default to "Pending".' },
          },
          required: ['day', 'time_slot', 'task_detail', 'category']
        }
      }
    },
    required: ['tasks']
  },
};

const systemInstruction = 'Eres un asistente de planificación semanal amigable y eficiente. Tu objetivo es ayudar al usuario a agregar tareas a su planificador. Habla en español. Cuando identifiques una tarea, utiliza la herramienta `createTasks` para proponerla. Si el usuario menciona que ya hizo la tarea, marca el estado como "Completed". Si es para el futuro, "Pending". Si la está haciendo, "In Progress". Puedes hacer preguntas para aclarar detalles si es necesario.';

// Fix: Create a single AI instance and infer session type for better performance and type safety.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
type LiveSessionType = Awaited<ReturnType<typeof ai.live.connect>>;


const AiTaskParserModal: React.FC<AiTaskParserModalProps> = ({ isOpen, onClose, onSave }) => {
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [proposedTasks, setProposedTasks] = useState<ParsedTask[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  
  // Fix: Use inferred LiveSessionType instead of the unexported LiveSession.
  const sessionPromise = useRef<Promise<LiveSessionType> | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const nextStartTime = useRef(0);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory]);

  const cleanupLiveSession = useCallback(() => {
    if (sessionPromise.current) {
      sessionPromise.current.then(session => session.close());
      sessionPromise.current = null;
    }
    if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
    }
    if (inputAudioContext.current && inputAudioContext.current.state !== 'closed') {
        inputAudioContext.current.close().catch(console.error);
        inputAudioContext.current = null;
    }
     if (outputAudioContext.current && outputAudioContext.current.state !== 'closed') {
        outputAudioContext.current.close().catch(console.error);
        outputAudioContext.current = null;
    }
    audioSources.current.forEach(source => source.stop());
    audioSources.current.clear();
    nextStartTime.current = 0;

    if (scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
    }
  }, []);

  const handleEndConversation = useCallback(() => {
    cleanupLiveSession();
    setAssistantStatus('idle');
    setConversationHistory(prev => [...prev, { role: 'system', text: 'La conversación ha finalizado.' }]);
  }, [cleanupLiveSession]);

  const handleClose = useCallback(() => {
    cleanupLiveSession();
    setAssistantStatus('idle');
    setConversationHistory([]);
    setProposedTasks([]);
    onClose();
  }, [onClose, cleanupLiveSession]);

  const handleStartConversation = useCallback(async () => {
    if (assistantStatus !== 'idle') return;

    try {
        setAssistantStatus('listening');
        setConversationHistory(prev => [...prev, { role: 'system', text: 'La conversación ha comenzado.' }]);
        
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        sessionPromise.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    if (!mediaStream.current || !inputAudioContext.current) return;
                    const source = inputAudioContext.current!.createMediaStreamSource(mediaStream.current!);
                    scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);

                    scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.current?.then((session) => {
                          session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current!.destination);
                },
                // Fix: Add LiveServerMessage type to message parameter to fix iterator error.
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription?.text) {
                      setConversationHistory(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'model') {
                          return [...prev.slice(0, -1), { ...last, text: last.text + message.serverContent!.outputTranscription!.text }];
                        }
                        return [...prev, { role: 'model', text: message.serverContent!.outputTranscription!.text }];
                      });
                    }
                    if (message.serverContent?.inputTranscription?.text) {
                       setConversationHistory(prev => {
                        const last = prev[prev.length - 1];
                        if (last?.role === 'user') {
                          return [...prev.slice(0, -1), { ...last, text: last.text + message.serverContent!.inputTranscription!.text }];
                        }
                        return [...prev, { role: 'user', text: message.serverContent!.inputTranscription!.text }];
                      });
                    }
                    
                    if (message.toolCall?.functionCalls) {
                      // Fix: The type from LiveServerMessage resolves the iterator error here.
                      for (const fc of message.toolCall.functionCalls) {
                        if (fc.name === 'createTasks' && fc.args.tasks) {
                          setProposedTasks(prev => [...prev, ...fc.args.tasks]);
                        }
                        const result = "ok";
                        sessionPromise.current?.then((session) => {
                          session.sendToolResponse({
                            functionResponses: {
                              id: fc.id,
                              name: fc.name,
                              response: { result: result },
                            }
                          });
                        });
                      }
                    }
                    
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContext.current && outputAudioContext.current.state === 'running') {
                        setAssistantStatus('speaking');
                        const decodedAudio = decode(audioData);
                        const audioBuffer = await decodeAudioData(decodedAudio, outputAudioContext.current!, 24000, 1);
                        
                        nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current!.currentTime);
                        
                        const source = outputAudioContext.current!.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.current!.destination);
                        
                        source.addEventListener('ended', () => {
                            audioSources.current.delete(source);
                            if (audioSources.current.size === 0) {
                                setAssistantStatus('listening');
                            }
                        });

                        source.start(nextStartTime.current);
                        nextStartTime.current += audioBuffer.duration;
                        audioSources.current.add(source);
                    }
                },
                // Fix: The callback expects an ErrorEvent, not an Error.
                onerror: (e: ErrorEvent) => {
                  console.error('Live session error:', e)
                  setConversationHistory(prev => [...prev, { role: 'system', text: `Error de conexión: ${e.message}` }]);
                  setAssistantStatus('idle');
                },
                onclose: () => {
                   console.log('Live session closed');
                   setAssistantStatus('idle');
                },
            },
            config: { 
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              responseModalities: [Modality.AUDIO],
              tools: [{ functionDeclarations: [createTasksFunctionDeclaration] }],
              // Fix: Removed unsupported `toolConfig` property.
              systemInstruction,
            },
        });
    } catch (err) {
      console.error("Failed to start conversation", err);
      setConversationHistory(prev => [...prev, { role: 'system', text: 'No se pudo iniciar el micrófono. Por favor, revisa los permisos.' }]);
      setAssistantStatus('idle');
    }
  }, [assistantStatus]);

  useEffect(() => {
    // Effect for cleanup when modal is closed from parent
    return () => {
        if(sessionPromise.current){
            cleanupLiveSession();
        }
    }
  }, [cleanupLiveSession]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = textInput.trim();
    if (!trimmedInput || isProcessingText) return;

    setIsProcessingText(true);
    const newConversationHistory: ConversationTurn[] = [...conversationHistory, { role: 'user', text: trimmedInput }];
    setConversationHistory(newConversationHistory);
    setTextInput('');

    try {
        const apiHistory = newConversationHistory
            .filter(turn => turn.role === 'user' || turn.role === 'model')
            .map(turn => ({
                role: turn.role,
                parts: [{ text: turn.text }],
            }));
        
        // Fix: Add explicit `GenerateContentResponse` type to resolve iterator error.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: apiHistory,
            config: {
                tools: [{ functionDeclarations: [createTasksFunctionDeclaration] }],
                systemInstruction,
            },
        });
        
        const functionCalls = response.functionCalls;
        if (functionCalls) {
            // Fix: The type from GenerateContentResponse resolves the iterator error here.
            for (const fc of functionCalls) {
                if (fc.name === 'createTasks' && fc.args.tasks) {
                    setProposedTasks(prev => [...prev, ...fc.args.tasks]);
                }
            }
        }
        
        const textResponse = response.text;
        if (textResponse) {
            setConversationHistory(prev => [...prev, { role: 'model', text: textResponse }]);
        }

    } catch (error) {
        console.error("Error processing text input:", error);
        setConversationHistory(prev => [...prev, { role: 'system', text: 'Hubo un error al procesar tu solicitud.' }]);
    } finally {
        setIsProcessingText(false);
    }
  };

  const AssistantStatusIndicator = () => {
    // Fix: Add `ping` property to all states to prevent destructuring error.
    const statusMap = {
      idle: { text: "Inactivo", color: "bg-gray-500", ping: false },
      listening: { text: "Escuchando...", color: "bg-blue-500", ping: true },
      thinking: { text: "Pensando...", color: "bg-yellow-500", ping: false },
      speaking: { text: "Hablando...", color: "bg-green-500", ping: false },
    };
    const { text, color, ping } = statusMap[assistantStatus];
    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                {ping && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
            </span>
            <span className="text-sm font-medium text-gray-300">{text}</span>
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={handleClose} aria-modal="true" role="dialog">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl border border-gray-700 flex flex-col min-h-0" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-100">Asistente de Tareas IA</h2>
            <AssistantStatusIndicator />
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-200" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="flex-grow p-4 overflow-hidden grid grid-cols-2 gap-4">
            {/* Conversation History & Text Input */}
            <div className="flex flex-col bg-gray-900/50 rounded-lg p-3 min-h-0">
                <h3 className="text-lg font-semibold text-indigo-400 mb-2">Conversación</h3>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {conversationHistory.map((turn, index) => (
                        <div key={index} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           {turn.role !== 'system' && (
                             <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${turn.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm break-words">{turn.text}</p>
                             </div>
                           )}
                           {turn.role === 'system' && (
                             <div className="w-full text-center text-xs text-gray-500 italic py-1">
                               <span>{turn.text}</span>
                             </div>
                           )}
                        </div>
                    ))}
                    <div ref={conversationEndRef} />
                </div>
                 <form onSubmit={handleSendText} className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={assistantStatus === 'listening' ? 'Habla o escribe tu tarea...' : 'Escribe tu tarea...'}
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-400"
                        disabled={isProcessingText}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed"
                        disabled={isProcessingText || !textInput.trim()}
                    >
                      {isProcessingText ? '...' : 'Enviar'}
                    </button>
                </form>
            </div>

            {/* Proposed Tasks */}
            <div className="flex flex-col bg-gray-900/50 rounded-lg p-3 min-h-0">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Tareas Propuestas</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                   {proposedTasks.length > 0 ? proposedTasks.map((task, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-md animate-scale-in">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-indigo-300">{task.task_detail}</p>
                        {task.status === 'Completed' && (
                             <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full border border-green-700">Done</span>
                        )}
                        {task.status === 'In Progress' && (
                             <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700">Doing</span>
                        )}
                        {(!task.status || task.status === 'Pending') && (
                             <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full border border-gray-500">To Do</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{task.day} - {task.time_slot}</p>
                      <p className="text-xs text-gray-400 capitalize">Categoría: {task.category}</p>
                    </div>
                  )) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center px-4">
                        <p>Las tareas que menciones por voz o texto aparecerán aquí. Haz clic en "Empezar a Hablar" para iniciar.</p>
                    </div>
                  )}
                </div>
            </div>
        </main>

        <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
            <div>
              {assistantStatus === 'idle' ? (
                <button
                  type="button"
                  onClick={handleStartConversation}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 4.5a2.5 2.5 0 015 0v6a2.5 2.5 0 01-5 0v-6zM10 15a4 4 0 004-4h-1.5a2.5 2.5 0 01-5 0H6a4 4 0 004 4z" />
                  </svg>
                  Empezar a Hablar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndConversation}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Finalizar Conversación
                </button>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onSave(proposedTasks)}
                disabled={proposedTasks.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Guardar {proposedTasks.length > 0 ? `${proposedTasks.length} Tarea(s)` : 'Tareas'}
              </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default AiTaskParserModal;
