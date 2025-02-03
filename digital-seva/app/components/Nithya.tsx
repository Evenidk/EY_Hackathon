// components/Nithya.tsx
"use client";
import { useState, useEffect, useRef } from 'react';
import { useUserSchemeData } from '../hooks/useUserSchemeData';
import { Message, Language, StateLanguages } from '../types/index';
import { stateLanguages } from '../config/languages';

export function Nithya() {
  const { userData, loading, error: userDataError } = useUserSchemeData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when user data is loaded
  useEffect(() => {
    if (userData && !loading && messages.length === 0) {
      const location = userData.location || 'default';
      const availableLanguages = (stateLanguages as StateLanguages)[location] || [];
      const languageOptions = availableLanguages.map((lang: Language, index: number) => 
        `${index + 1}️⃣ ${lang.nativeName} (${lang.name})`
      ).join('\n');

      const greeting = `Hello ${userData.name}, my name is Nithya - Your Personalized Guide to Government Schemes, Anytime, Anywhere.\n\n` +
        `I can see you're from ${location}. Which language would you like to continue in?\n\n${languageOptions}`;

      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [userData, loading, messages.length]);

  const handleLanguageSelection = (input: string) => {
    const number = parseInt(input);
    const location = userData?.location || 'default';
    const availableLanguages = (stateLanguages as StateLanguages)[location] || [];
    
    if (number > 0 && number <= availableLanguages.length) {
      const selected = availableLanguages[number - 1];
      setSelectedLanguage(selected);

      const menu = `Perfect! I'll continue in ${selected.name}.\n\nHow can I help you? You can ask about:\n` +
        `✔ Eligibility criteria for a scheme\n` +
        `✔ Required documents\n` +
        `✔ Application process\n` +
        `✔ Benefits of a scheme\n` +
        `✔ Tracking application status`;

      setMessages(prev => [...prev, 
        { role: 'user', content: `Selected ${selected.name}` },
        { role: 'assistant', content: menu }
      ]);
    } else {
      setMessages(prev => [...prev, 
        { role: 'assistant', content: 'Please select a valid language option (1-3).' }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    const newMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, newMessage]);
    setUserInput('');

    try {
      if (!selectedLanguage) {
        handleLanguageSelection(userInput);
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          language: selectedLanguage.code,
          userData
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

    } catch (err) {
      setError('Sorry, I encountered an error. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userDataError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          Error loading user data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white">
        <h1 className="text-xl font-bold">Nithya - AI Assistant</h1>
        {selectedLanguage && (
          <div className="text-sm">
            Language: {selectedLanguage.nativeName} ({selectedLanguage.name})
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white shadow'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">
                {message.content}
              </pre>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 text-center text-red-500 bg-red-100">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isProcessing ? 'Processing...' : 'Type your message...'}
            disabled={isProcessing}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !userInput.trim()}
            className={`px-4 py-2 rounded-lg bg-primary text-white ${
              isProcessing || !userInput.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-primary-dark'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}