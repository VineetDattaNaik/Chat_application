import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        // First check if user exists in user_chat table
        const { data: existingUser, error: checkError } = await supabase
          .from('user_chat')
          .select('email')
          .eq('email', email)
          .single();

        if (existingUser) {
          setErrorMessage('User already exists! Please use a different email.');
          setEmail(''); // Clear the email field
          setLoading(false);
          return;
        }

        // If user doesn't exist, proceed with signup
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setErrorMessage(signUpError.message);
        } else {
          // Add user to user_chat table
          const username = email.split('@')[0]; // Create username from email
          const { error: insertError } = await supabase
            .from('user_chat')
            .insert([
              {
                email: email,
                username: username,
                created_at: new Date().toISOString()
              }
            ]);

          if (insertError) {
            setErrorMessage('Error creating user profile');
          } else {
            alert('Check your email for the confirmation link!');
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    input: {
      padding: '12px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      fontSize: '16px',
    },
    button: {
      padding: '12px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
    },
    toggle: {
      marginTop: '20px',
      textAlign: 'center',
      color: '#4CAF50',
      cursor: 'pointer',
    },
    errorMessage: {
      color: '#dc2626',
      textAlign: 'center',
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#fef2f2',
      borderRadius: '5px',
      border: '1px solid #fee2e2',
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleAuth} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      {errorMessage && (
        <div style={styles.errorMessage}>
          {errorMessage}
        </div>
      )}
      <p style={styles.toggle} onClick={() => {
        setIsSignUp(!isSignUp);
        setErrorMessage(''); // Clear error message when switching modes
      }}>
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </p>
    </div>
  );
}

export default Auth;




