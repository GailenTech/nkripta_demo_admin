import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  EditButton,
} from 'react-admin';

const ProfileList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="firstName" label="Nombre" />
      <TextField source="lastName" label="Apellido" />
      <EmailField source="email" label="Email" />
      <TextField source="position" label="Cargo" />
      <TextField source="organizationId" label="ID Organización" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);

export default ProfileList;