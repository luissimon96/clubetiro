import { User } from '../../models/user';

// Simple in-memory store for users
export let users: User[] = [];

export const getUserStore = () => users;
export const setUserStore = (newUsers: User[]) => {
  users = newUsers;
};