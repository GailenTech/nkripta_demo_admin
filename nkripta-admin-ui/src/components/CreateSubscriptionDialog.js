import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';

const CreateSubscriptionDialog = ({
  open,
  onClose,
  subscription,
  onChange,
  onCreate,
  plans,
  coupons,
  loading,
  loadingPlans,
  loadingCoupons
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Nueva Suscripción</DialogTitle>
      <DialogContent>
        <Box my={2}>
          {/* Selección de plan */}
          <FormControl fullWidth margin="dense" disabled={loadingPlans}>
            <InputLabel id="plan-label">Plan</InputLabel>
            <Select
              labelId="plan-label"
              id="planId"
              name="planId"
              value={subscription.planId}
              onChange={onChange}
              label="Plan"
            >
              {loadingPlans ? (
                <MenuItem value="">Cargando planes...</MenuItem>
              ) : (
                plans.map(plan => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} - {(plan.unitAmount / 100).toFixed(2)}€/{plan.interval}
                  </MenuItem>
                ))
              )}
            </Select>
            {plans.length > 0 && subscription.planId && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {plans.find(p => p.id === subscription.planId)?.description || ''}
              </Typography>
            )}
          </FormControl>
          
          {/* Información de tarjeta (en un entorno real, aquí iría Stripe Elements) */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Información de Pago
          </Typography>
          
          <TextField
            margin="dense"
            name="cardName"
            label="Nombre en la tarjeta"
            type="text"
            fullWidth
            variant="outlined"
            value={subscription.cardName}
            onChange={onChange}
            required
          />
          
          <TextField
            margin="dense"
            name="cardNumber"
            label="Número de tarjeta"
            type="text"
            fullWidth
            variant="outlined"
            value={subscription.cardNumber}
            onChange={onChange}
            disabled={true} // En modo desarrollo, usamos siempre la tarjeta de prueba
            helperText="En modo desarrollo, se usa la tarjeta de prueba 4242..."
          />
          
          <Box display="flex" gap={2}>
            <TextField
              margin="dense"
              name="cardExpiry"
              label="Fecha expiración (MM/AA)"
              type="text"
              fullWidth
              variant="outlined"
              value={subscription.cardExpiry}
              onChange={onChange}
              disabled={true} // En modo desarrollo
            />
            
            <TextField
              margin="dense"
              name="cardCvc"
              label="CVC"
              type="text"
              fullWidth
              variant="outlined"
              value={subscription.cardCvc}
              onChange={onChange}
              disabled={true} // En modo desarrollo
            />
          </Box>
          
          {/* Selección de cupón (solo para admins) */}
          {coupons.length > 0 && (
            <FormControl fullWidth margin="dense" sx={{ mt: 3 }}>
              <InputLabel id="coupon-label">Cupón (opcional)</InputLabel>
              <Select
                labelId="coupon-label"
                id="couponId"
                name="couponId"
                value={subscription.couponId}
                onChange={onChange}
                label="Cupón (opcional)"
              >
                <MenuItem value="">Sin cupón</MenuItem>
                {coupons.map(coupon => (
                  <MenuItem key={coupon.id} value={coupon.id}>
                    {coupon.name} {coupon.percentOff ? `(${coupon.percentOff}% descuento)` : 
                                   coupon.amountOff ? `(${(coupon.amountOff/100).toFixed(2)}€ descuento)` : ''}
                  </MenuItem>
                ))}
              </Select>
              {subscription.couponId && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1 }}>
                  Se aplicará el descuento del cupón a esta suscripción
                  {coupons.find(c => c.id === subscription.couponId)?.duration === 'once' && 
                   " solo para el primer período de facturación"}
                  {coupons.find(c => c.id === subscription.couponId)?.duration === 'repeating' && 
                   ` durante ${coupons.find(c => c.id === subscription.couponId)?.durationInMonths || 3} meses`}
                  {coupons.find(c => c.id === subscription.couponId)?.duration === 'forever' && 
                   " durante toda la vida de la suscripción"}
                </Typography>
              )}
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancelar
        </Button>
        <Button 
          onClick={onCreate} 
          color="primary" 
          variant="contained"
          disabled={!subscription.planId || !subscription.cardName || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Crear Suscripción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSubscriptionDialog;