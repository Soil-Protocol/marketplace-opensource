export const paginate = <T>(arr: T[], page: number, pageSize: number): T[] => {
  return arr.slice((page - 1) * pageSize, page * pageSize)
}
