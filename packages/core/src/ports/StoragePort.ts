/**
 * Contrat de persistance générique injectable (Postgres, Firebase, mémoire...).
 * Volontairement minimal : chaque module (Sport, Journal...) garde sa propre base
 * et affine ce contrat selon ses besoins réels au moment de l'implémenter.
 */
export interface StoragePort<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
