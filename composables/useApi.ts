/**
 * Composable genérico para interagir com endpoints de API CRUD.
 * @param url O caminho base da API (ex: '/api/mensalidades')
 */
export const useApi = <T>(url: string) => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const handleRequest = async <R>(request: () => Promise<R>): Promise<R> => {
    try {
      loading.value = true;
      error.value = null;
      return await request();
    } catch (err: any) {
      error.value = err.message || 'Ocorreu um erro inesperado';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getAll = async (): Promise<T[]> => {
    return handleRequest(() => $fetch<T[]>(url));
  };

  const getById = async (id: string): Promise<T> => {
    return handleRequest(() => $fetch<T>(`${url}/${id}`));
  };

  const create = async (data: Partial<T>): Promise<T> => {
    return handleRequest(() =>
      $fetch<T>(url, {
        method: 'POST',
        body: data,
      })
    );
  };

  const update = async (id: string, data: Partial<T>): Promise<T> => {
    return handleRequest(() =>
      $fetch<T>(`${url}/${id}`, {
        method: 'PUT',
        body: data,
      })
    );
  };

  const remove = async (id: string): Promise<void> => {
    return handleRequest(() =>
      $fetch(`${url}/${id}`, {
        method: 'DELETE',
      })
    );
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    getAll,
    getById,
    create,
    update,
    remove,
  };
};
