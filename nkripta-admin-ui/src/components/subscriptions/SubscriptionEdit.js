import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  BooleanInput,
  SelectInput,
} from 'react-admin';

const SubscriptionEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="stripeSubscriptionId" label="ID Suscripción Stripe" />
      <TextInput source="profileId" label="ID Perfil" />
      <TextInput source="organizationId" label="ID Organización" />
      <SelectInput source="planType" label="Plan" choices={[
        { id: 'plan_basic', name: 'Básico (9.99€)' },
        { id: 'plan_premium', name: 'Premium (29.99€)' },
      ]} />
      <SelectInput source="status" label="Estado" choices={[
        { id: 'active', name: 'Activa' },
        { id: 'past_due', name: 'Pago Pendiente' },
        { id: 'canceled', name: 'Cancelada' },
        { id: 'unpaid', name: 'No Pagada' },
        { id: 'trialing', name: 'En Prueba' },
      ]} />
      <DateInput source="currentPeriodStart" label="Inicio Período" />
      <DateInput source="currentPeriodEnd" label="Fin Período" />
      <BooleanInput source="cancelAtPeriodEnd" label="Cancelar al final del período" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default SubscriptionEdit;