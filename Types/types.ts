export type ModalDetails = {
  _id: string;
  domain: string;
  username: string;
  email: string;
  password: string;
};

export type RootStackParamList = {
  Registeration: undefined;
  LogIn: undefined;
  About: undefined;
  PasswordList: undefined;
  AddScreen: undefined;
  ListScreen: undefined;
  modalItem: { data?: ModalDetails } | undefined;
};
