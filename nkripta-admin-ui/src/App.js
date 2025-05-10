import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Paper, Tabs, Tab, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Box, CircularProgress, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Breadcrumbs, Link, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CreateSubscriptionDialog from './components/CreateSubscriptionDialog';
import SubscriptionDetailDialog from './components/SubscriptionDetailDialog';
import { getAuthHeaders } from './config/auth';

// API URL
const API_URL = 'http://localhost:3000/api';

// Create a date formatter
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

// Componente principal
function App() {
  const [view, setView] = useState('organizations'); // ['organizations', 'organization-profiles', 'profile-subscriptions']
  const [tabValue, setTabValue] = useState(0);
  const [organizations, setOrganizations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para navegación y detalle
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [organizationProfiles, setOrganizationProfiles] = useState([]);
  const [profileSubscriptions, setProfileSubscriptions] = useState([]);
  
  // Estados para crear nuevo perfil
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    roles: ['USER']
  });
  
  // Estados para crear nueva suscripción
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [newSubscription, setNewSubscription] = useState({
    planId: '',
    paymentMethodId: 'pm_card_visa', // Mock para entorno de desarrollo
    couponId: '',
    cardNumber: '4242424242424242',
    cardExpiry: '12/25',
    cardCvc: '123',
    cardName: ''
  });
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  
  // Estados para ver detalles de suscripción
  const [detailSubscriptionOpen, setDetailSubscriptionOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Resetear vista actual
    if (newValue === 0) {
      setView('organizations');
      setSelectedOrganization(null);
      setSelectedProfile(null);
    } else if (newValue === 1) {
      setView('profiles');
    } else if (newValue === 2) {
      setView('subscriptions');
    }
  };

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar organizaciones
        const orgResponse = await fetch(`${API_URL}/organizations`, {
          headers: getAuthHeaders()
        });
        const orgData = await orgResponse.json();
        console.log('Organizations data:', orgData);
        setOrganizations(orgData.items || orgData || []);
        
        // Cargar perfiles
        const profileResponse = await fetch(`${API_URL}/profiles`, {
          headers: getAuthHeaders()
        });
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
        const subResponse = await fetch(`${API_URL}/billing`, {
          headers: getAuthHeaders()
        });
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
  
  // Manejadores para navegación jerárquica
  const handleOrganizationClick = async (organization) => {
    setSelectedOrganization(organization);
    setLoading(true);
    
    try {
      // Cargar perfiles de esta organización
      const profilesResponse = await fetch(`${API_URL}/organizations/${organization.id}/members`, {
        headers: getAuthHeaders()
      });
      let organizationProfiles = [];
      
      if (profilesResponse.ok) {
        const profilesData = await profilesResponse.json();
        organizationProfiles = profilesData.items || profilesData || [];
      } else {
        // Si la API de miembros de organización no está disponible, filtrar manualmente
        organizationProfiles = profiles.filter(profile => 
          profile.organizationId === organization.id
        );
      }
      
      setOrganizationProfiles(organizationProfiles);
      setView('organization-profiles');
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar perfiles de la organización:", err);
      // Filtrar manualmente como fallback
      const filteredProfiles = profiles.filter(profile => 
        profile.organizationId === organization.id
      );
      setOrganizationProfiles(filteredProfiles);
      setView('organization-profiles');
      setLoading(false);
    }
  };
  
  const handleProfileClick = async (profile) => {
    setSelectedProfile(profile);
    setLoading(true);
    
    try {
      // Cargar suscripciones de este perfil usando la ruta correcta
      // Probar primero el endpoint correcto
      const subscriptionsResponse = await fetch(`${API_URL}/billing/profiles/${profile.id}/subscriptions`, {
        headers: getAuthHeaders()
      });
      let profileSubscriptions = [];
      
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        profileSubscriptions = subscriptionsData.items || subscriptionsData || [];
        console.log('Suscripciones obtenidas:', profileSubscriptions);
      } else {
        console.warn('No se pudo acceder al endpoint específico, probando endpoint general con filtro...');
        
        // Intentar con endpoint alternativo filtrando por profileId
        try {
          const alternativeResponse = await fetch(`${API_URL}/billing/subscriptions?profileId=${profile.id}`, {
            headers: getAuthHeaders()
          });
          if (alternativeResponse.ok) {
            const subscriptionsData = await alternativeResponse.json();
            profileSubscriptions = subscriptionsData.items || subscriptionsData || [];
            console.log('Suscripciones alternativas obtenidas:', profileSubscriptions);
          } else {
            // Como último recurso, filtrar desde la lista global
            profileSubscriptions = subscriptions.filter(sub => 
              sub.profileId === profile.id
            );
            console.log('Filtrando suscripciones manualmente:', profileSubscriptions);
          }
        } catch (altError) {
          console.error('Error al intentar con endpoint alternativo:', altError);
          // Filtrar manualmente
          profileSubscriptions = subscriptions.filter(sub => 
            sub.profileId === profile.id
          );
        }
      }
      
      // Simplemente registrar que no hay suscripciones y continuar
      if (profileSubscriptions.length === 0) {
        console.log('No se encontraron suscripciones para este perfil');
      }
      
      setProfileSubscriptions(profileSubscriptions);
      setView('profile-subscriptions');
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar suscripciones del perfil:", err);
      
      // En caso de error, mostrar lista vacía
      console.log('No fue posible obtener suscripciones debido a un error de comunicación');
      setProfileSubscriptions([]);
      setView('profile-subscriptions');
      setLoading(false);
    }
  };
  
  const handleBackToOrganizations = () => {
    setView('organizations');
    setSelectedOrganization(null);
    setSelectedProfile(null);
  };
  
  const handleBackToProfiles = () => {
    setView('organization-profiles');
    setSelectedProfile(null);
  };
  
  // Manejadores para crear nuevo perfil
  const handleCreateProfileOpen = () => {
    setNewProfile({
      email: '',
      firstName: '',
      lastName: '',
      position: '',
      roles: ['USER']
    });
    setCreateProfileOpen(true);
  };
  
  const handleCreateProfileClose = () => {
    setCreateProfileOpen(false);
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setNewProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRolesChange = (e) => {
    setNewProfile(prev => ({
      ...prev,
      roles: Array.isArray(e.target.value) ? e.target.value : [e.target.value]
    }));
  };
  
  const handleCreateProfile = async () => {
    try {
      setLoading(true);
      
      // Añadir organizationId del perfil seleccionado
      const profileData = {
        ...newProfile,
        organizationId: selectedOrganization.id
      };
      
      // Llamada a la API para crear perfil
      const response = await fetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Perfil creado:', result);
        
        // Refrescar lista de perfiles de la organización
        const updatedProfiles = [...organizationProfiles, result];
        setOrganizationProfiles(updatedProfiles);
        
        // Cerrar diálogo
        setCreateProfileOpen(false);
      } else {
        const errorData = await response.json();
        console.error('Error al crear perfil:', errorData);
        alert(`Error al crear perfil: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al crear perfil:', error);
      alert(`Error al crear perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejadores para crear nueva suscripción
  const handleCreateSubscriptionOpen = async () => {
    setLoadingPlans(true);
    setLoadingCoupons(true);
    
    try {
      // Cargar planes disponibles
      const plansResponse = await fetch(`${API_URL}/billing/plans`, {
        headers: getAuthHeaders()
      });
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData);
        
        // Preseleccionar el plan básico mensual si existe
        const basicPlan = plansData.find(plan => 
          plan.name.toLowerCase().includes('básico') && 
          plan.interval === 'month'
        );
        
        if (basicPlan) {
          setNewSubscription(prev => ({
            ...prev,
            planId: basicPlan.id
          }));
        } else if (plansData.length > 0) {
          // O el primer plan si no hay uno básico
          setNewSubscription(prev => ({
            ...prev,
            planId: plansData[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoadingPlans(false);
    }
    
    try {
      // Intentar cargar cupones disponibles (solo para administradores)
      const couponsResponse = await fetch(`${API_URL}/billing/coupons`, {
        headers: getAuthHeaders()
      });
      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        setCoupons(couponsData);
      }
    } catch (error) {
      console.error('Error al cargar cupones:', error);
      // No mostrar error si no es admin, simplemente no mostrar cupones
    } finally {
      setLoadingCoupons(false);
    }
    
    // Prepopular el nombre de la tarjeta con el nombre del perfil
    if (selectedProfile) {
      setNewSubscription(prev => ({
        ...prev,
        cardName: `${selectedProfile.firstName} ${selectedProfile.lastName}`
      }));
    }
    
    setCreateSubscriptionOpen(true);
  };
  
  const handleCreateSubscriptionClose = () => {
    setCreateSubscriptionOpen(false);
  };
  
  const handleSubscriptionChange = (e) => {
    const { name, value } = e.target;
    setNewSubscription(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateSubscription = async () => {
    try {
      setLoading(true);
      
      // En un entorno real, aquí se crearía primero el método de pago 
      // usando Stripe Elements o similar. Para simplificar, usaremos un ID mock.
      
      // Preparar datos de la suscripción
      const subscriptionData = {
        planId: newSubscription.planId,
        paymentMethodId: newSubscription.paymentMethodId
      };
      
      // Añadir cupón si se seleccionó uno
      if (newSubscription.couponId) {
        subscriptionData.couponId = newSubscription.couponId;
      }
      
      // Llamada a la API para crear suscripción
      const response = await fetch(`${API_URL}/billing/subscriptions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(subscriptionData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Suscripción creada:', result);
        
        // Refrescar lista de suscripciones
        await handleProfileClick(selectedProfile);
        
        // Cerrar diálogo
        setCreateSubscriptionOpen(false);
      } else {
        const errorData = await response.json();
        console.error('Error al crear suscripción:', errorData);
        alert(`Error al crear suscripción: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al crear suscripción:', error);
      alert(`Error al crear suscripción: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderizar barra de navegación
  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ my: 2 }}>
        <Link 
          color={view === 'organizations' ? 'text.primary' : 'inherit'} 
          onClick={handleBackToOrganizations}
          style={{ cursor: 'pointer' }}
          underline="hover"
        >
          Organizaciones
        </Link>
        
        {(view === 'organization-profiles' || view === 'profile-subscriptions') && (
          <Link 
            color={view === 'organization-profiles' ? 'text.primary' : 'inherit'} 
            onClick={handleBackToProfiles}
            style={{ cursor: 'pointer' }}
            underline="hover"
          >
            {selectedOrganization?.name || 'Perfiles'}
          </Link>
        )}
        
        {view === 'profile-subscriptions' && (
          <Typography color="text.primary">
            {selectedProfile?.firstName} {selectedProfile?.lastName}
          </Typography>
        )}
      </Breadcrumbs>
    );
  };

  // Renderizar tabla de organizaciones
  const renderOrganizationsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Creado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id || 'unknown'}>
              <TableCell>{org.name || 'N/A'}</TableCell>
              <TableCell>{org.slug || 'N/A'}</TableCell>
              <TableCell>{org.email || 'N/A'}</TableCell>
              <TableCell>{org.phone || 'N/A'}</TableCell>
              <TableCell>{formatDate(org.createdAt)}</TableCell>
              <TableCell>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleOrganizationClick(org)}
                >
                  Ver Perfiles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizar tabla de perfiles de una organización
  const renderOrganizationProfilesTable = () => (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Perfiles de {selectedOrganization?.name}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateProfileOpen}
        >
          Nuevo Perfil
        </Button>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizationProfiles.map((profile) => (
              <TableRow key={profile.id || 'unknown'}>
                <TableCell>{profile.firstName || 'N/A'}</TableCell>
                <TableCell>{profile.lastName || 'N/A'}</TableCell>
                <TableCell>{profile.email || 'N/A'}</TableCell>
                <TableCell>{profile.position || 'N/A'}</TableCell>
                <TableCell>{Array.isArray(profile.roles) ? profile.roles.join(', ') : (profile.roles || 'N/A')}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    onClick={() => handleProfileClick(profile)}
                  >
                    Ver Suscripciones
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {organizationProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay perfiles para esta organización
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  // Renderizar tabla de suscripciones de un perfil
  const renderProfileSubscriptionsTable = () => {
    // Crear un identificador único basado en el perfil para cualquier caso donde
    // todos los IDs de suscripción sean idénticos (común con Stripe Mock)
    const profileIdSuffix = selectedProfile?.id?.substring(0, 6) || '';
    const createdAt = selectedProfile?.createdAt || new Date().toISOString();
    const uniqueSuffix = new Date(createdAt).getTime().toString().substring(6, 12);
    
    return (
      <>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">
            Suscripciones de {selectedProfile?.firstName} {selectedProfile?.lastName}
          </Typography>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Inicio Período</TableCell>
                <TableCell>Fin Período</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profileSubscriptions.map((sub, index) => {
                // Generar un ID de suscripción artificial único cuando se detectan IDs idénticos
                // Sólo hacemos esto si los IDs de suscripción son idénticos para múltiples elementos
                const isStaticMockId = profileSubscriptions.length > 1 && 
                  index > 0 && 
                  sub.subscriptionId === profileSubscriptions[0].subscriptionId;
                
                const displayId = isStaticMockId 
                  ? `${sub.subscriptionId.substring(0, 8)}_${profileIdSuffix}_${index}` 
                  : (sub.id || sub.subscriptionId || 'N/A');
                
                return (
                  <TableRow key={`${sub.id || sub.subscriptionId || 'unknown'}_${index}`}>
                    <TableCell>
                      {displayId}
                      {isStaticMockId && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          (ID visualización única)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.planName || 
                        (sub.planType === 'plan_basic' ? 'Básico' :
                        sub.planType === 'plan_premium' ? 'Premium' :
                        (sub.planType || 'N/A'))}
                    </TableCell>
                    <TableCell>
                      {sub.planPrice ? 
                        `${sub.planPrice} ${sub.planCurrency?.toUpperCase() || 'EUR'}` : 
                        (sub.planType === 'plan_basic' || sub.planType?.includes('999')) ? '9.99 EUR' :
                        (sub.planType === 'plan_premium' || sub.planType?.includes('2999')) ? '29.99 EUR' : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {sub.status === 'active' && sub.cancelAtPeriodEnd ? (
                        <Chip label="Pausada" color="warning" size="small" />
                      ) : sub.status === 'active' ? (
                        <Chip label="Activa" color="success" size="small" />
                      ) : sub.status === 'canceled' ? (
                        <Chip label="Cancelada" color="error" size="small" />
                      ) : sub.status === 'past_due' ? (
                        <Chip label="Pago pendiente" color="warning" size="small" />
                      ) : (
                        sub.status || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>{formatDate(sub.currentPeriodStart)}</TableCell>
                    <TableCell>{formatDate(sub.currentPeriodEnd)}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        color="primary"
                        onClick={() => handleViewSubscriptionDetails(sub)}
                        aria-label="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {profileSubscriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={3}>
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay suscripciones activas
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Este perfil no tiene ninguna suscripción activa en este momento.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={handleCreateSubscriptionOpen}
                      >
                        Añadir suscripción
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  // Renderizar tabla de perfiles (vista general)
  const renderProfilesTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
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
              <TableCell>{profile.firstName || 'N/A'}</TableCell>
              <TableCell>{profile.lastName || 'N/A'}</TableCell>
              <TableCell>{profile.email || 'N/A'}</TableCell>
              <TableCell>{profile.position || 'N/A'}</TableCell>
              <TableCell>{profile.Organization?.name || profile.organizationId || 'N/A'}</TableCell>
              <TableCell>{Array.isArray(profile.roles) ? profile.roles.join(', ') : (profile.roles || 'N/A')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Renderizar tabla de suscripciones (vista general)
  const renderSubscriptionsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Precio</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Perfil</TableCell>
            <TableCell>Organización</TableCell>
            <TableCell>Inicio Período</TableCell>
            <TableCell>Fin Período</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subscriptions.map((sub) => (
            <TableRow key={sub.id || sub.subscriptionId || 'unknown'}>
              <TableCell>{sub.id || sub.subscriptionId || 'N/A'}</TableCell>
              <TableCell>
                {sub.planName || 
                  (sub.planType === 'plan_basic' ? 'Básico' :
                  sub.planType === 'plan_premium' ? 'Premium' :
                  (sub.planType || 'N/A'))}
              </TableCell>
              <TableCell>
                {sub.planPrice ? 
                  `${sub.planPrice} ${sub.planCurrency?.toUpperCase() || 'EUR'}` : 
                  (sub.planType === 'plan_basic' || sub.planType?.includes('999')) ? '9.99 EUR' :
                  (sub.planType === 'plan_premium' || sub.planType?.includes('2999')) ? '29.99 EUR' : 'N/A'}
              </TableCell>
              <TableCell>{sub.status || 'N/A'}</TableCell>
              <TableCell>{sub.customerEmail || 'N/A'}</TableCell>
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
  
  // Diálogo para crear nuevo perfil
  const renderCreateProfileDialog = () => (
    <Dialog open={createProfileOpen} onClose={handleCreateProfileClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Nuevo Perfil</DialogTitle>
      <DialogContent>
        <Box my={2}>
          <TextField
            autoFocus
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newProfile.email}
            onChange={handleProfileChange}
            required
          />
          <TextField
            margin="dense"
            name="firstName"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={newProfile.firstName}
            onChange={handleProfileChange}
            required
          />
          <TextField
            margin="dense"
            name="lastName"
            label="Apellido"
            type="text"
            fullWidth
            variant="outlined"
            value={newProfile.lastName}
            onChange={handleProfileChange}
            required
          />
          <TextField
            margin="dense"
            name="position"
            label="Cargo"
            type="text"
            fullWidth
            variant="outlined"
            value={newProfile.position}
            onChange={handleProfileChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="roles-label">Roles</InputLabel>
            <Select
              labelId="roles-label"
              id="roles"
              multiple
              value={newProfile.roles}
              onChange={handleRolesChange}
              label="Roles"
            >
              <MenuItem value="USER">Usuario</MenuItem>
              <MenuItem value="ADMIN">Administrador</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            * Se enviará un email al usuario con instrucciones para establecer su contraseña.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreateProfileClose} color="primary">
          Cancelar
        </Button>
        <Button 
          onClick={handleCreateProfile} 
          color="primary" 
          variant="contained"
          disabled={!newProfile.email || !newProfile.firstName || !newProfile.lastName}
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Manejador para ver detalles de la suscripción
  const handleViewSubscriptionDetails = (subscription) => {
    setSelectedSubscription(subscription);
    setDetailSubscriptionOpen(true);
  };
  
  // Manejador para actualizar la lista de suscripciones después de una acción
  const handleSubscriptionUpdate = async () => {
    // Recargar las suscripciones del perfil
    await handleProfileClick(selectedProfile);
  };

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
            <Tab label="Perfiles" disabled={view !== 'profiles'} />
            <Tab label="Suscripciones" disabled={view !== 'subscriptions'} />
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
                <Typography variant="h6" color="error">Error al cargar datos:</Typography>
                <Typography color="error">{error}</Typography>
                <Box mt={2}>
                  <Typography variant="body2">
                    Posibles soluciones:
                  </Typography>
                  <ul>
                    <li>Verifica que el servidor backend esté ejecutándose</li>
                    <li>Ejecuta './scripts/reset-environment.sh' para reiniciar el entorno</li>
                    <li>Edita '.env' y cambia USE_STRIPE_MOCK=false para usar solo la base de datos</li>
                  </ul>
                </Box>
              </Box>
            </Paper>
          ) : (
            <>
              {renderBreadcrumbs()}
              
              {/* Vista principal de organizaciones */}
              {view === 'organizations' && renderOrganizationsTable()}
              
              {/* Vista de perfiles de una organización */}
              {view === 'organization-profiles' && renderOrganizationProfilesTable()}
              
              {/* Vista de suscripciones de un perfil */}
              {view === 'profile-subscriptions' && renderProfileSubscriptionsTable()}
              
              {/* Vistas generales (accesibles desde pestañas) */}
              {view === 'profiles' && renderProfilesTable()}
              {view === 'subscriptions' && renderSubscriptionsTable()}
              
              {/* Diálogo para crear nuevo perfil */}
              {renderCreateProfileDialog()}
              
              {/* Diálogo para crear nueva suscripción */}
              <CreateSubscriptionDialog
                open={createSubscriptionOpen}
                onClose={handleCreateSubscriptionClose}
                subscription={newSubscription}
                onChange={handleSubscriptionChange}
                onCreate={handleCreateSubscription}
                plans={plans}
                coupons={coupons}
                loading={loading}
                loadingPlans={loadingPlans}
                loadingCoupons={loadingCoupons}
              />
              
              {/* Diálogo para ver detalles de suscripción */}
              <SubscriptionDetailDialog
                open={detailSubscriptionOpen}
                onClose={() => setDetailSubscriptionOpen(false)}
                subscription={selectedSubscription}
                profileId={selectedProfile?.id}
                onUpdate={handleSubscriptionUpdate}
              />
            </>
          )}
        </Box>
      </Container>
    </div>
  );
}

export default App;