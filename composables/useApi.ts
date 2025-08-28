/**
 * Composable genérico para interagir com endpoints de API CRUD.
 * @param url O caminho base da API (ex: '/api/mensalidades')
 */
export const useApi = <T>(url: string) => {
  const getAll = async (): Promise<T[]> => {
    return await $fetch<T[]>(url);
  };

  const create = async (data: Partial<T>): Promise<T> => {
    return await $fetch<T>(url, {
      method: 'POST',
      body: data,
    });
  };

  const remove = async (id: string): Promise<void> => {
    // A resposta para um DELETE bem-sucedido é vazia.
    await $fetch(`${url}/${id}`, {
      method: 'DELETE',
    });
  };

  return {
    getAll,
    create,
    remove,
  };
};
