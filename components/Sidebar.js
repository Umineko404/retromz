'use client';
import { useState, useEffect, useRef } from 'react';
import { Client } from 'irc-framework';
import { auth } from '../src/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState('#grokchat');
  const [nickname, setNickname] = useState('');
  const clientRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Monitor Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNickname(currentUser.displayName || currentUser.email.split('@')[0]);
      } else {
        setNickname(`Guest${Math.floor(Math.random() * 10000)}`);
      }
    });

    // Initialize IRC client
    clientRef.current = new Client();

    clientRef.current.on('connected', () => {
      setIsConnected(true);
      setError(null);
      clientRef.current.join(channel);
      addMessage('System', 'Connected to IRC server!');
    });

    clientRef.current.on('message', (event) => {
      if (event.type === 'privmsg' && event.target === channel) {
        addMessage(event.nick, event.message);
      }
    });

    clientRef.current.on('error', (err) => {
      setError(`IRC Error: ${err.message}`);
      setIsConnected(false);
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
      if (clientRef.current) {
        clientRef.current.quit();
      }
    };
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (nick, message) => {
    setMessages((prev) => [
      ...prev,
      { nick, message, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const connectToIRC = () => {
    if (!isConnected && clientRef.current) {
      try {
        clientRef.current.connect({
          host: 'irc.libera.chat',
          port: 6667,
          nick: nickname,
          username: nickname,
          version: 'Grok IRC Client',
        });
      } catch (err) {
        setError(`Connection failed: ${err.message}`);
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected && clientRef.current) {
      clientRef.current.say(channel, inputMessage);
      addMessage(nickname, inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="col-lg-3">
      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>IRC Chat ({channel})</span>
          {isConnected ? (
            <span className="text-success small">Connected</span>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={connectToIRC}
              disabled={isConnected}
            >
              Connect
            </button>
          )}
        </div>
        <div className="card-body p-3" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div className="text-danger small mb-2">{error}</div>
          )}
          <div
            className="border rounded p-2 mb-2"
            style={{ flex: 1, overflowY: 'auto', background: '#1a1a1a' }}
          >
            {messages.map((msg, index) => (
              <div key={index} className="mb-1 small">
                <span className="text-muted">[{msg.timestamp}] </span>
                <span className="fw-bold">{msg.nick}: </span>
                <span>{msg.message}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control bg-dark border-secondary"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!isConnected}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={!isConnected || !inputMessage.trim()}
            >
              Send
            </button>
          </div>
          <div className="mt-2">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-dark border-secondary">Nick</span>
              <input
                type="text"
                className="form-control bg-dark border-secondary"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="input-group input-group-sm mt-1">
              <span className="input-group-text bg-dark border-secondary">Channel</span>
              <input
                type="text"
                className="form-control bg-dark border-secondary"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                disabled={isConnected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}