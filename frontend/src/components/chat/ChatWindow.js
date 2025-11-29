'use client';

/**
 * ===========================================
 * Chat Window Component
 * ===========================================
 */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { FiArrowLeft, FiSend, FiImage, FiPaperclip } from 'react-icons/fi';

export default function ChatWindow({ onBack }) {
  const { user } = useAuth();
  const {
    currentRoom,
    messages,
    isTyping,
    typingUser,
    sendMessage,
    sendTyping,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    sendTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  // Handle send message
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    sendTyping(false);
    
    try {
      sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!currentRoom) return null;

  const otherParticipant = currentRoom.other_participant;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center space-x-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft size={20} />
          </button>
        )}
        
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
          {(otherParticipant?.shop_name || otherParticipant?.username || '?')[0].toUpperCase()}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium">
            {otherParticipant?.shop_name || otherParticipant?.username}
          </h3>
          {isTyping && (
            <p className="text-sm text-gray-500">กำลังพิมพ์...</p>
          )}
          {currentRoom.product_name && (
            <p className="text-xs text-primary-500">📦 {currentRoom.product_name}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                {formatDate(dateMessages[0].created_at)}
              </span>
            </div>

            {/* Messages */}
            {dateMessages.map((message, index) => {
              const isMine = message.sender_id === user?.id || message.sender === user?.id;
              
              return (
                <div
                  key={message.id || index}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isMine
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    {/* Image */}
                    {message.image_url && (
                      <img
                        src={message.image_url}
                        alt="Image"
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    
                    {/* Content */}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {/* Time & Read Status */}
                    <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                      <span>{formatTime(message.created_at)}</span>
                      {isMine && (
                        <span>{message.is_read ? '✓✓' : '✓'}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          {/* Attachment Buttons */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiImage size={20} />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiPaperclip size={20} />
          </button>

          {/* Input Field */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}