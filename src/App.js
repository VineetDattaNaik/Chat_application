import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import socket, { disconnectSocket } from './socket';

function App() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [session, setSession] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        setUsername(session.user.email.split('@')[0]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        setUsername(session.user.email.split('@')[0]);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [session]);

  useEffect(() => {
    // Create socket event listener
    const handleChatMessage = async (data) => {
      // Only add message to chat if it's from another user
      if (data.user !== username) {
        setChat((prev) => [...prev, data]);
        await storeMessage(data);
      }
    };

    // Add event listener
    socket.on('chat message', handleChatMessage);

    // Cleanup function to remove event listener
    return () => {
      socket.off('chat message', handleChatMessage);
    };
  }, [session, username]); // Add username to dependencies

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setChat(data);
    }
  };

  const storeMessage = async (messageData) => {
    // Check if we have an active session
    if (!session?.user) {
      console.warn('No active session, message not stored in database');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          text: messageData.text,
          user_id: session.user.id,
          username: messageData.user,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Error storing message:', error);
      }
    } catch (error) {
      console.error('Error storing message:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      // First disconnect socket
      disconnectSocket();
      
      // Clear all states first
      setIsJoined(false);
      setChat([]);
      setUsername('');
      setMessage('');
      setSession(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      // Force a page reload to clear all states and reconnection attempts
      window.location.replace('/');
      
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  // Separate useEffect for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', session); // Debug log
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log('Handling sign out...'); // Debug log
        
        // Disconnect socket
        disconnectSocket();
        
        // Clear all states
        setIsJoined(false);
        setChat([]);
        setUsername('');
        setMessage('');
        setSession(null);
        
        // Force reload
        window.location.replace('/');
      }
    });

    // Cleanup subscription
    return () => {
      console.log('Cleaning up auth subscription'); // Debug log
      subscription?.unsubscribe();
    };
  }, []);

  // Add session initialization effect
  useEffect(() => {
    const initSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        return;
      }
      setSession(session);
    };

    initSession();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && session?.user) {
      const messageData = {
        text: message,
        user: username,
        username: username,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user_id: session.user.id,
        created_at: new Date().toISOString()
      };

      // Add our own message to chat immediately
      setChat(prev => [...prev, messageData]);
      
      // Emit the message
      socket.emit('chat message', messageData);
      
      // Store our own message in Supabase
      storeMessage(messageData);
      
      // Clear input
      setMessage('');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsJoined(true);
      setChat(prev => [...prev, { 
        text: `${username} joined the chat`,
        system: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const clearChat = () => {
    setChat([]);
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f0f2f5',
    },
    
    header: {
      background: 'linear-gradient(to right, #4CAF50, #45a049)',
      color: 'white',
      padding: '25px 30px',
      borderRadius: '20px 20px 0 0',
      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
    },
    
    userInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '10px',
    },
    
    chatContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '0 0 20px 20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      scrollBehavior: 'smooth',
    },
    
    messageForm: {
      display: 'flex',
      gap: '15px',
      padding: '25px',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      position: 'relative',
    },
    
    input: {
      flex: 1,
      padding: '15px 20px',
      borderRadius: '15px',
      border: '2px solid #e8eaed',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      backgroundColor: '#f8f9fa',
      outline: 'none',
      '&:focus': {
        borderColor: '#4CAF50',
        backgroundColor: 'white',
        boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.1)',
      },
    },
    
    button: {
      padding: '15px 30px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '15px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: '#45a049',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },
    
    message: {
      padding: '15px 20px',
      borderRadius: '18px',
      maxWidth: '70%',
      width: 'fit-content',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
    },
    
    myMessage: {
      backgroundColor: '#4CAF50',
      color: 'white',
      alignSelf: 'flex-end',
      borderBottomRightRadius: '5px',
    },
    
    otherMessage: {
      backgroundColor: '#f0f2f5',
      color: '#1F2937',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: '5px',
    },
    
    systemMessage: {
      textAlign: 'center',
      color: '#64748b',
      fontStyle: 'italic',
      margin: '10px 0',
      fontSize: '14px',
      padding: '10px 20px',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '30px',
      alignSelf: 'center',
      maxWidth: '80%',
    },
    
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      fontSize: '14px',
    },
    
    username: {
      fontWeight: '600',
      fontSize: '15px',
    },
    
    messageTime: {
      fontSize: '12px',
      marginLeft: '10px',
      opacity: 0.8,
    },
    
    myMessageTime: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    
    otherMessageTime: {
      color: '#64748b',
    },
    
    messageText: {
      lineHeight: '1.5',
      wordBreak: 'break-word',
      fontSize: '15px',
    },
    
    joinForm: {
      maxWidth: '450px',
      margin: '60px auto',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '24px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      animation: 'slideUp 0.5s ease',
    },
    
    joinHeader: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#1F2937',
      fontSize: '28px',
      fontWeight: '700',
    },
    
    signOutButton: {
      padding: '10px 20px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: '#dc2626',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },

    buttonGroup: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
    },

    clearButton: {
      padding: '10px 20px',
      backgroundColor: '#f59e0b',  // amber color
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      '&:hover': {
        backgroundColor: '#d97706',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    },

    '@keyframes slideUp': {
      from: {
        transform: 'translateY(20px)',
        opacity: 0,
      },
      to: {
        transform: 'translateY(0)',
        opacity: 1,
      },
    },
  };

  if (!session) {
    return <Auth />;
  }

  if (!isJoined) {
    return (
      <div style={styles.container}>
        <div style={styles.joinForm}>
          <h2 style={styles.joinHeader}>Join the Chat</h2>
          <form onSubmit={handleJoin}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={styles.input}
            />
            <button type="submit" style={{...styles.button, width: '100%', marginTop: '16px'}}>
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Real-Time Chat</h2>
        <div style={styles.userInfo}>
          <p>Welcome, {username}!</p>
          <div style={styles.buttonGroup}>
            <button 
              onClick={clearChat} 
              style={{
                ...styles.button,
                backgroundColor: '#6c757d'
              }}
            >
              Clear Chat
            </button>
            <button 
              onClick={handleSignOut} 
              style={{
                ...styles.button,
                backgroundColor: '#dc3545',
                marginLeft: '10px'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      <div style={styles.chatContainer}>
        {chat.map((msg, index) => (
          msg.system ? (
            <div key={index} style={styles.systemMessage}>
              {msg.text}
            </div>
          ) : (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(msg.user === username ? styles.myMessage : styles.otherMessage)
              }}
            >
              <div style={styles.messageHeader}>
                <span style={styles.username}>{msg.username || msg.user}</span>
                <span style={{
                  ...styles.messageTime,
                  ...(msg.user === username ? styles.myMessageTime : styles.otherMessageTime)
                }}>
                  {msg.time}
                </span>
              </div>
              <div style={styles.messageText}>{msg.text}</div>
            </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.messageForm}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Send</button>
      </form>
    </div>
  );
}

export default App;
