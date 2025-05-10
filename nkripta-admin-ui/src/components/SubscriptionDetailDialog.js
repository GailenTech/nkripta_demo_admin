import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, CircularProgress, Chip,
  Divider, Grid, Card, CardContent, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
  Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentIcon from '@mui/icons-material/Payment';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { getAuthHeaders } from '../config/auth';

// API URL
const API_URL = 'http://localhost:3000/api';

// Componente para mostrar detalles de la suscripción
const SubscriptionDetailDialog = ({
  open,
  onClose,
  subscription,
  profileId,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  
  // Cargar los métodos de pago del perfil cuando se abre el diálogo
  useEffect(() => {
    if (open && profileId) {
      fetchPaymentMethods();
    }
  }, [open, profileId]);
  
  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Obtener los métodos de pago
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await fetch(`${API_URL}/billing/profiles/${profileId}/payment-methods`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        console.error('Error al obtener métodos de pago');
      }
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };
  
  // Acciones de suscripción
  const handleActionClick = (event) => {
    setActionMenuAnchor(event.currentTarget);
  };
  
  const handleActionClose = () => {
    setActionMenuAnchor(null);
  };
  
  // Pausar suscripción
  const handlePauseSubscription = async () => {
    handleActionClose();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/billing/subscriptions/${subscription.subscriptionId}/pause`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Suscripción pausada:', result);
        
        // Actualizar la suscripción localmente para reflejar el cambio inmediatamente
        if (subscription) {
          subscription.cancelAtPeriodEnd = true;
          console.log("Actualización local realizada, suscripción ahora pausada", subscription);
        }
        
        // Actualizar la suscripción en el estado padre
        if (onUpdate) onUpdate();
      } else {
        const errorData = await response.json();
        console.error('Error al pausar suscripción:', errorData);
        alert(`Error al pausar suscripción: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al pausar suscripción:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Reanudar suscripción
  const handleResumeSubscription = async () => {
    handleActionClose();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/billing/subscriptions/${subscription.subscriptionId}/resume`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Suscripción reanudada:', result);
        
        // Actualizar la suscripción localmente para reflejar el cambio inmediatamente
        if (subscription) {
          subscription.cancelAtPeriodEnd = false;
          console.log("Actualización local realizada, suscripción ahora activa", subscription);
        }
        
        // Actualizar la suscripción en el estado padre
        if (onUpdate) onUpdate();
      } else {
        const errorData = await response.json();
        console.error('Error al reanudar suscripción:', errorData);
        alert(`Error al reanudar suscripción: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al reanudar suscripción:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancelar suscripción
  const handleCancelSubscription = async () => {
    handleActionClose();
    // Confirmar antes de cancelar
    const confirmCancel = window.confirm('¿Estás seguro de que deseas cancelar esta suscripción? Esta acción no se puede deshacer.');
    if (!confirmCancel) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/billing/subscriptions/${subscription.subscriptionId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Suscripción cancelada:', result);
        
        // Actualizar la suscripción localmente para reflejar el cambio inmediatamente
        if (subscription) {
          subscription.status = 'canceled';
          subscription.cancelAtPeriodEnd = true;
          console.log("Actualización local realizada, suscripción ahora cancelada", subscription);
        }
        
        // Actualizar la suscripción en el estado padre
        if (onUpdate) onUpdate();
        
        // Cerrar el diálogo
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error al cancelar suscripción:', errorData);
        alert(`Error al cancelar suscripción: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar tarjeta de crédito
  const renderCardInfo = (card) => {
    const getBrandLogo = (brand) => {
      switch(brand.toLowerCase()) {
        case 'visa': return '💳 Visa';
        case 'mastercard': return '💳 Mastercard';
        case 'amex': return '💳 American Express';
        default: return '💳 ' + brand;
      }
    };
    
    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" component="div">
            {getBrandLogo(card.brand)} •••• {card.last4}
          </Typography>
          <Typography color="text.secondary">
            Expira: {card.expiryMonth}/{card.expiryYear}
          </Typography>
          {card.isDefault && (
            <Chip 
              label="Predeterminada" 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Obtener el estado de la suscripción
  const getStatusChip = () => {
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;
    
    if (status === 'active' && cancelAtPeriodEnd) {
      return <Chip label="Pausada" color="warning" />;
    } else if (status === 'active') {
      return <Chip label="Activa" color="success" />;
    } else if (status === 'canceled') {
      return <Chip label="Cancelada" color="error" />;
    } else if (status === 'past_due') {
      return <Chip label="Pago pendiente" color="warning" />;
    } else {
      return <Chip label={status} />;
    }
  };
  
  // Si no hay suscripción, no mostrar nada
  if (!subscription) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="subscription-detail-dialog"
    >
      <DialogTitle id="subscription-detail-dialog">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Detalles de Suscripción
          </Typography>
          {getStatusChip()}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Información básica */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Plan</Typography>
                <Typography>{subscription.planName || 'No disponible'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Precio</Typography>
                <Typography>
                  {subscription.planPrice ? 
                    `${subscription.planPrice} ${subscription.planCurrency?.toUpperCase() || 'EUR'}` : 
                    'No disponible'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Inicio del período</Typography>
                <Typography>{formatDate(subscription.currentPeriodStart)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Fin del período</Typography>
                <Typography>{formatDate(subscription.currentPeriodEnd)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">ID</Typography>
                <Typography 
                  sx={{ 
                    fontSize: '0.85rem', 
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  {subscription.subscriptionId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Renovación</Typography>
                <Typography>
                  {subscription.cancelAtPeriodEnd ? 
                    'No se renovará automáticamente' : 
                    'Renovación automática'}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Cupón aplicado */}
            {subscription.hasCoupon && (
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold">Cupón aplicado</Typography>
                <Card variant="outlined" sx={{ mt: 1, bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="body1" color="white" fontWeight="bold">
                      {subscription.coupon.name}
                    </Typography>
                    <Typography variant="body2" color="white">
                      {subscription.coupon.percentOff 
                        ? `${subscription.coupon.percentOff}% de descuento` 
                        : subscription.coupon.amountOff 
                          ? `${(subscription.coupon.amountOff/100).toFixed(2)}€ de descuento` 
                          : 'Descuento aplicado'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
            
            {/* Método de pago */}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="payment-methods-content"
                id="payment-methods-header"
              >
                <Box display="flex" alignItems="center">
                  <PaymentIcon sx={{ mr: 1 }} />
                  <Typography>Métodos de pago</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {loadingPaymentMethods ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : paymentMethods.length > 0 ? (
                  paymentMethods.map((method, index) => (
                    <Box key={method.id} mb={index < paymentMethods.length - 1 ? 2 : 0}>
                      {renderCardInfo(method.card)}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" align="center">
                    No hay métodos de pago disponibles
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          color="primary" 
          onClick={onClose}
          disabled={loading}
        >
          Cerrar
        </Button>
        
        {subscription.status === 'active' && (
          <>
            <Button
              startIcon={<MoreVertIcon />}
              onClick={handleActionClick}
              disabled={loading}
              color="primary"
              variant="outlined"
            >
              Opciones
            </Button>
            
            <Menu
              anchorEl={actionMenuAnchor}
              open={Boolean(actionMenuAnchor)}
              onClose={handleActionClose}
            >
              {subscription.cancelAtPeriodEnd ? (
                <MenuItem onClick={handleResumeSubscription}>
                  <ListItemIcon>
                    <PlayArrowIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Reanudar suscripción</ListItemText>
                </MenuItem>
              ) : (
                <MenuItem onClick={handlePauseSubscription}>
                  <ListItemIcon>
                    <PauseIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Pausar suscripción</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={handleCancelSubscription}>
                <ListItemIcon>
                  <CancelIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{ color: 'error' }}>
                  Cancelar suscripción
                </ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionDetailDialog;