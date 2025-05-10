import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
} from 'react-admin';

const ProfileEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="firstName" label="Nombre" />
      <TextInput source="middleName" label="Segundo Nombre" />
      <TextInput source="lastName" label="Apellido" />
      <TextInput source="position" label="Cargo" />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Teléfono" />
      <TextInput source="organizationId" label="ID Organización" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default ProfileEdit;