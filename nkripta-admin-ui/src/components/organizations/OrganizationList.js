import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  EditButton,
} from 'react-admin';

const OrganizationList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="name" label="Nombre" />
      <TextField source="slug" label="Slug" />
      <EmailField source="email" label="Email" />
      <TextField source="phone" label="Teléfono" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);

export default OrganizationList;