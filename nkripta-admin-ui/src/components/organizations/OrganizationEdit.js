import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
} from 'react-admin';

const OrganizationEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="name" label="Nombre" />
      <TextInput source="slug" label="Slug" />
      <TextInput source="description" label="Descripción" multiline />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Teléfono" />
      <TextInput source="website" label="Sitio Web" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default OrganizationEdit;