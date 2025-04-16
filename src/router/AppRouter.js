import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { LoginScreen } from '../components/auth/LoginScreen';
import { CalendarScreen } from '../components/calendar/CalendarScreen';
import { startChecking } from '../actions/auth';

export const AppRouter = () => {

  const dispatch = useDispatch();
  const { checking, uid } = useSelector(state => state.auth);

  useEffect(() => {
      dispatch(startChecking());
  }, [dispatch]);

  if (checking) {
      return (<h5>Espere...</h5>);
  }

  return (
    <Router>
      <div>
        <Routes>
          {/* Ruta Pública para Login */}
          <Route
            path="/login"
            element={!uid ? <LoginScreen /> : <Navigate to="/" />}
          />

          {/* Ruta Privada para el calendario */}
          <Route
            path="/"
            element={uid ? <CalendarScreen /> : <Navigate to="/login" />}
          />

          {/* Redireccionar cualquier otra ruta a "/" */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};
