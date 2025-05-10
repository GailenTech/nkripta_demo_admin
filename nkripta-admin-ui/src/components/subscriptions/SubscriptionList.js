import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
} from 'react-admin';

const SubscriptionList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="planType" label="Plan" />
      <TextField source="status" label="Estado" />
      <TextField source="profileId" label="ID Perfil" />
      <TextField source="organizationId" label="ID Organización" />
      <DateField source="currentPeriodStart" label="Inicio Período" />
      <DateField source="currentPeriodEnd" label="Fin Período" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);

export default SubscriptionList;