import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Home } from './components/Home';
import { ResetPassword } from './components/ResetPassword';
import { PaymentSuccess } from './components/PaymentSuccess';
import { StripeReturn } from './components/StripeReturn';
import { Terms } from './components/Terms';
import { Privacy } from './components/Privacy';
import { CommercialLaw } from './components/CommercialLaw';
import { Contact } from './components/Contact';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/stripe-return" element={<StripeReturn />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/commercial-law" element={<CommercialLaw />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
};

export default App;