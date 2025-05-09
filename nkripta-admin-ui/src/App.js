import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Paper, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, CircularProgress
} from '@mui/material';

// API URL
const API_URL = 'http://localhost:3000/api';

// Create a date formatter
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

// Componente principal
function App() {
  const [tabValue, setTabValue] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar organizaciones
        const orgResponse = await fetch(`${API_URL}/organizations`);
        const orgData = await orgResponse.json();
        console.log('Organizations data:', orgData);
        setOrganizations(orgData.items || orgData || []);
        
        // Cargar perfiles
        const profileResponse = await fetch(`${API_URL}/profiles`);
        const profileData = await profileResponse.json();
        console.log('Profiles data:', profileData);
        
        // Asegurar que estemos usando la estructura correcta para profiles
        if (profileData && profileData.items) {
          setProfiles(profileData.items);
        } else if (Array.isArray(profileData)) {
          setProfiles(profileData);
        } else {
          console.error('Formato de datos de perfiles inesperado:', profileData);
          setProfiles([]);
        }
        
        // Cargar suscripciones (usando el endpoint correcto)
        const subResponse = await fetch(`${API_URL}/billing`);
        const subData = await subResponse.json();
        console.log('Subscriptions data:', subData);
        
        // Asegurar que estemos usando la estructura correcta para suscripciones
        if (subData && subData.items) {
          setSubscriptions(subData.items);
        } else if (Array.isArray(subData)) {
          setSubscriptions(subData);
        } else {
          console.error('Formato de datos de suscripciones inesperado:', subData);
          setSubscriptions([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar datos. Asegúrate de que el servidor esté en ejecución.");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Renderizar tabla de organizaciones
  const renderOrganizationsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Creado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id || 'unknown'}>
              <TableCell>{org.id || 'N/A'}</TableCell>
              <TableCell>{org.name || 'N/A'}</TableCell>
              <TableCell>{org.slug || 'N/A'}</TableCell>
              <TableCell>{org.email || 'N/A'}</TableCell>
              <TableCell>{org.phone || 'N/A'}</TableCell>
              <TableCell>{formatDate(org.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizar tabla de perfiles
  const renderProfilesTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Apellido</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Cargo</TableCell>
            <TableCell>Organización</TableCell>
            <TableCell>Roles</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id || 'unknown'}>
              <TableCell>{profile.id || 'N/A'}</TableCell>
              <TableCell>{profile.firstName || 'N/A'}</TableCell>
              <TableCell>{profile.lastName || 'N/A'}</TableCell>
              <TableCell>{profile.email || 'N/A'}</TableCell>
              <TableCell>{profile.position || 'N/A'}</TableCell>
              <TableCell>{profile.organizationId || 'N/A'}</TableCell>
              <TableCell>{Array.isArray(profile.roles) ? profile.roles.join(', ') : (profile.roles || 'N/A')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizar tabla de suscripciones
  const renderSubscriptionsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Perfil</TableCell>
            <TableCell>Organización</TableCell>
            <TableCell>Inicio Período</TableCell>
            <TableCell>Fin Período</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.id || 'unknown'}>
              <TableCell>{sub.id || 'N/A'}</TableCell>
              <TableCell>
                {sub.planType === 'plan_basic' ? 'Básico (9.99€)' :
                 sub.planType === 'plan_premium' ? 'Premium (29.99€)' :
                 (sub.planType || 'N/A')}
              </TableCell>
              <TableCell>{sub.status || 'N/A'}</TableCell>
              <TableCell>{sub.profileId || 'N/A'}</TableCell>
              <TableCell>{sub.organizationId || 'N/A'}</TableCell>
              <TableCell>{formatDate(sub.currentPeriodStart)}</TableCell>
              <TableCell>{formatDate(sub.currentPeriodEnd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Nkripta Admin
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" style={{ marginTop: 20 }}>
        <Paper>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Organizaciones" />
            <Tab label="Perfiles" />
            <Tab label="Suscripciones" />
          </Tabs>
        </Paper>
        
        <Box mt={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={5}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper>
              <Box p={3}>
                <Typography color="error">{error}</Typography>
              </Box>
            </Paper>
          ) : (
            <>
              {tabValue === 0 && renderOrganizationsTable()}
              {tabValue === 1 && renderProfilesTable()}
              {tabValue === 2 && renderSubscriptionsTable()}
            </>
          )}
        </Box>
      </Container>
    </div>
  );
}

export default App;