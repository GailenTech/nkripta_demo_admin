import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';

const Dashboard = () => (
  <Card>
    <CardHeader title="Bienvenido al Panel de Administración de Nkripta" />
    <CardContent>
      <p>
        Desde este panel puedes gestionar las entidades principales del sistema:
      </p>
      <ul>
        <li>
          <strong>Organizaciones</strong> - Empresas y negocios que utilizan la plataforma
        </li>
        <li>
          <strong>Perfiles</strong> - Usuarios asociados a las organizaciones
        </li>
        <li>
          <strong>Suscripciones</strong> - Planes contratados por los usuarios
        </li>
      </ul>
      <p>
        Utiliza el menú de la izquierda para navegar entre las diferentes secciones.
      </p>
      <p>
        <strong>Planes disponibles:</strong>
      </p>
      <ul>
        <li>Plan Básico (9.99€/mes)</li>
        <li>Plan Premium (29.99€/mes)</li>
      </ul>
    </CardContent>
  </Card>
);

export default Dashboard;